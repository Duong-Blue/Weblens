import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import { URL } from 'url';
import getPort from 'get-port';
import * as fs from 'fs';
import * as path from 'path';
import { CrawlResult, ConsoleMessageEntry, NetworkRequest, LighthouseData, ScreenshotItem } from '@weblens/audit-engine';

interface SitemapInfo {
  found: boolean;
  urlCount?: number;
  urls?: string[];
}

interface RobotsInfo {
  found: boolean;
  disallowed?: string[];
  sitemaps?: string[];
}



// Script injected before navigation to capture Core Web Vitals via PerformanceObserver.
// Runs in-browser — uses plain JS (no TS-specific syntax) so addInitScript stringification is safe.
const CWV_SCRIPT = `
window.__cwv = { lcp: undefined, inp: undefined, cls: 0 };

try {
  new PerformanceObserver(function(list) {
    var entries = list.getEntries();
    if (entries.length > 0) {
      window.__cwv.lcp = entries[entries.length - 1].startTime;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch (e) {}

try {
  var inpEntries = [];
  new PerformanceObserver(function(list) {
    var entries = list.getEntries();
    for (var i = 0; i < entries.length; i++) {
      inpEntries.push(entries[i]);
      
      var latency = entries[i].processingStart - entries[i].startTime;
      if (window.__cwv.inp === undefined || latency > window.__cwv.inp) {
        window.__cwv.inp = latency;
      }
    }
  }).observe({ type: 'first-input', buffered: true });
} catch (e) {}

try {
  var clsValue = 0;
  new PerformanceObserver(function(list) {
    for (var i = 0; i < list.getEntries().length; i++) {
      var entry = list.getEntries()[i];
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    window.__cwv.cls = clsValue;
  }).observe({ type: 'layout-shift', buffered: true });
} catch (e) {}
`;

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  async crawl(url: string): Promise<CrawlResult> {
    const port = await getPort();
    const browser: Browser = await chromium.launch({ 
      headless: true,
      args: [`--remote-debugging-port=${port}`]
    });
    const page: Page = await browser.newPage();

    const networkRequests: NetworkRequest[] = [];
    const consoleMessages: ConsoleMessageEntry[] = [];

    // Collect network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        status: 0,
        statusText: '',
        startTime: performance.now(),
        requestHeaders: request.headers(),
      });
    });

    page.on('response', async response => {
      const req = networkRequests.find(r => r.url === response.url());
      if (req) {
        req.status = response.status();
        req.statusText = response.statusText();
        req.endTime = performance.now();
        req.duration = req.startTime ? req.endTime - req.startTime : undefined;
        req.responseHeaders = response.headers();
        
        try {
          const timing = response.request().timing();
          if (timing) {
            req.dnsLookupMs = timing.domainLookupEnd - timing.domainLookupStart;
            req.tcpConnectionMs = timing.connectEnd - timing.connectStart;
            req.tlsNegotiationMs = timing.secureConnectionStart ? timing.connectEnd - timing.secureConnectionStart : undefined;
            req.timeToFirstByteMs = timing.responseStart - timing.requestStart;
          }
        } catch (e) {
        }

        const serverHeader = await response.serverAddr().catch(() => null);
        if (serverHeader) {
          req.remoteAddress = `${serverHeader.ipAddress}:${serverHeader.port}`;
        }
        
        const securityDetails = await response.securityDetails().catch(() => null);
        if (securityDetails) {
          req.protocol = securityDetails.protocol;
        }

        try {
          const sizes = await response.request().sizes();
          if (sizes) {
            req.transferSize = sizes.responseHeadersSize + sizes.responseBodySize;
            req.encodedBodySize = sizes.responseBodySize;
          }
        } catch (e) {
        }
      }
    });

    // Collect console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type() as any,
        text: msg.text(),
        location: {
          url: msg.location().url,
          line: msg.location().lineNumber,
          column: msg.location().columnNumber,
        },
        timestamp: Date.now(),
      });
    });

    await page.addInitScript(CWV_SCRIPT);

    const response = await page.goto(url, { waitUntil: 'networkidle' });

    const mainHeaders: Record<string, string> = response ? response.headers() : {};

    await this.scrollPageWithLazyLoad(page);

    await page.waitForTimeout(3000);

    const screenshots = await this.captureScreenshots(page, url);


    const cwvRaw = await page.evaluate(() =>
      JSON.stringify((window as any).__cwv || { lcp: undefined, inp: undefined, cls: 0 }));
    let cwv: { lcp?: number; inp?: number; cls?: number; fcp?: number; ttfb?: number };
    try {
      cwv = JSON.parse(cwvRaw);
    } catch {
      cwv = { lcp: undefined, inp: undefined, cls: 0 };
    }

    // Get performance timings
    const performanceTiming = await page.evaluate(() => JSON.stringify(window.performance.timing));
    const parsedTiming = JSON.parse(performanceTiming);

    const content = await page.content();

    // Fetch sitemap.xml relative to target URL
    const sitemapInfo = await this.fetchSitemap(url);

    // Fetch robots.txt relative to target URL
    const robotsInfo = await this.fetchRobotsTxt(url);

    let lighthouseData: LighthouseData;
    try {
      this.logger.log(`Running Lighthouse for ${url} on port ${port}...`);
      const lhModule: any = await eval(`import('lighthouse')`);
      const lighthouseFn = lhModule.default || lhModule;
      const lhResult = await lighthouseFn(url, {
        port,
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        disableStorageReset: true, 
      });

      if (!lhResult || !lhResult.lhr || !lhResult.lhr.categories) {
        throw new Error('Invalid Lighthouse result structure');
      }

      const categories = lhResult.lhr.categories;
      lighthouseData = {
        performance: Math.round((categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((categories.seo?.score ?? 0) * 100),
      };
      this.logger.log(`Lighthouse completed successfully for ${url}`);
    } catch (error) {
      this.logger.error(`Lighthouse failed for ${url}:`, error);
      lighthouseData = this.computeLighthouseData({
        performanceTiming: parsedTiming,
        cwv,
        networkRequests,
        consoleMessages,
        htmlContent: content,
      });
      this.logger.log(`Used fallback simulated Lighthouse data for ${url} due to failure.`);
    }

    await browser.close();

    return {
      htmlContent: content,
      networkRequests,
      consoleMessages,
      performanceTiming: parsedTiming,
      sitemapInfo,
      robotsInfo,
      cwv,
      lighthouseData,
      mainHeaders,
      screenshots,
    };
  }

  private async scrollPageWithLazyLoad(page: Page) {
    const scrollDelay = 200;
    const scrollStep = 500;
    const lazyWait = 1000;
    const batchSize = 5;
    
    let pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    let scrolledDistance = 0;
    let scrollCount = 0;
    
    while (scrolledDistance < pageHeight - viewportHeight) {
      await page.evaluate((y: number) => window.scrollTo(0, y), scrolledDistance + scrollStep);
      scrolledDistance += scrollStep;
      scrollCount++;
      
      if (scrollCount % batchSize === 0) {
        await page.waitForTimeout(lazyWait);
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight > pageHeight) {
          pageHeight = newHeight;
        }
      } else {
        await page.waitForTimeout(scrollDelay);
      }
    }
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }

  private async captureScreenshots(page: Page, url: string) {
    const reportDir = path.resolve(process.cwd(), '../../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const domain = new URL(url).hostname;
    const timestamp = Date.now();
    const screenshotDir = path.join(reportDir, domain, timestamp.toString());
    fs.mkdirSync(screenshotDir, { recursive: true });

    const viewports = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 812 },
    };

    const screenshots: CrawlResult['screenshots'] = {
      viewport: {
        desktop: null as any,
        tablet: null as any,
        mobile: null as any,
      },
      fullPage: {
        desktop: null as any,
        mobile: null as any,
      }
    };

    for (const [device, size] of Object.entries(viewports)) {
      await page.setViewportSize(size);
      await page.waitForTimeout(500);

      const vpPath = path.join(screenshotDir, `${device}-viewport.png`);
      const vpBuffer = await page.screenshot({ path: vpPath, fullPage: false });
      screenshots.viewport[device as keyof typeof viewports] = {
        viewport: device,
        path: path.relative(process.cwd(), vpPath),
        width: size.width,
        height: size.height,
        fullPage: false,
        darkMode: false,
        fileSize: vpBuffer.length,
        format: 'png',
        timestamp: Date.now(),
        takenAtMs: 0,
      };

      if (device === 'desktop' || device === 'mobile') {
        const fpPath = path.join(screenshotDir, `${device}-full.png`);
        const fpBuffer = await page.screenshot({ path: fpPath, fullPage: true });
        screenshots.fullPage[device as keyof typeof screenshots.fullPage] = {
          viewport: device,
          path: path.relative(process.cwd(), fpPath),
          width: size.width,
          height: size.height,
          fullPage: true,
          darkMode: false,
          fileSize: fpBuffer.length,
          format: 'png',
          timestamp: Date.now(),
          takenAtMs: 0,
        };
      }
    }

    await page.setViewportSize(viewports.desktop);
    return screenshots;
  }

  /**
   * Derives simulated Lighthouse-like scores from available crawl metrics.
   * Uses Navigation Timing API, Core Web Vitals, network request analysis,
   * console message inspection, and basic HTML parsing.
   *
   * TODO: Replace with real Lighthouse run when infrastructure allows.
   */
  private computeLighthouseData(data: {
    performanceTiming: any;
    cwv: { lcp?: number; inp?: number; cls?: number; fcp?: number; ttfb?: number };
    networkRequests: NetworkRequest[];
    consoleMessages: ConsoleMessageEntry[];
    htmlContent: string;
  }): LighthouseData {
    const { performanceTiming, cwv, networkRequests, consoleMessages, htmlContent } = data;

    // --- Performance Score ---
    const loadTime =
      (performanceTiming.loadEventEnd || 0) - (performanceTiming.navigationStart || 0);
    let perfScore = 100;

    // Load time penalties
    if (loadTime > 6000) perfScore -= 40;
    else if (loadTime > 4000) perfScore -= 25;
    else if (loadTime > 2000) perfScore -= 10;

    // Core Web Vitals penalties
    if (cwv.lcp !== undefined && cwv.lcp > 4000) perfScore -= 20;
    else if (cwv.lcp !== undefined && cwv.lcp > 2500) perfScore -= 10;

    if (cwv.cls !== undefined && cwv.cls > 0.25) perfScore -= 20;
    else if (cwv.cls !== undefined && cwv.cls > 0.1) perfScore -= 10;

    // Network penalties
    const totalRequests = networkRequests.length;
    if (totalRequests > 100) perfScore -= 20;
    else if (totalRequests > 50) perfScore -= 10;

    const failedRequests = networkRequests.filter((r) => r.status >= 400).length;
    perfScore -= Math.min(failedRequests * 2, 10);

    // Count render-blocking-like resources (scripts, stylesheets)
    const renderBlockingCount = networkRequests.filter(
      (r) => r.resourceType === 'script' || r.resourceType === 'stylesheet',
    ).length;
    if (renderBlockingCount > 20) perfScore -= 10;
    else if (renderBlockingCount > 10) perfScore -= 5;

    perfScore = Math.max(0, Math.min(100, Math.round(perfScore)));

    // --- Accessibility Score ---
    let accScore = 100;

    // Viewport meta tag
    const hasViewport = /<meta\s[^>]*name\s*=\s*["']viewport["'][^>]*\/?>/i.test(htmlContent);
    if (!hasViewport) accScore -= 20;

    // Images missing alt attribute
    const imgRegex = /<img[^>]*>/gi;
    let totalImgs = 0;
    let missingAltImgs = 0;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(htmlContent)) !== null) {
      totalImgs++;
      if (!/alt\s*=/i.test(imgMatch[0])) missingAltImgs++;
    }
    if (totalImgs > 0) {
      const missingAltRatio = missingAltImgs / totalImgs;
      accScore -= Math.round(missingAltRatio * 30);
    }

    // Check for heading structure
    const hasH1 = /<h1[\s>]/i.test(htmlContent);
    const hasH2 = /<h2[\s>]/i.test(htmlContent);
    if (!hasH1 && !hasH2) accScore -= 15;

    // Console errors (JS errors affect user experience/interaction)
    const errorCount = consoleMessages.filter((m) => m.type === 'error').length;
    accScore -= Math.min(errorCount * 5, 20);

    // Language attribute on <html>
    const hasLangAttr = /<html[^>]*\slang\s*=/i.test(htmlContent);
    if (!hasLangAttr) accScore -= 10;

    accScore = Math.max(0, Math.min(100, Math.round(accScore)));

    // --- Best Practices Score ---
    let bpScore = 100;

    // Console errors/warnings
    bpScore -= Math.min(errorCount * 5, 30);
    const warnCount = consoleMessages.filter((m) => m.type === 'warning').length;
    bpScore -= Math.min(warnCount * 2, 10);

    // Doctype presence
    const hasDoctype = /<!doctype\s+html/i.test(htmlContent);
    if (!hasDoctype) bpScore -= 10;

    // Viewport meta (reuse from above)
    if (!hasViewport) bpScore -= 10;

    // Check for deprecated HTML features like <center>, <font>, <marquee>
    const hasDeprecatedTags = /<\/(center|font|marquee)>/i.test(htmlContent);
    if (hasDeprecatedTags) bpScore -= 10;

    // Console errors suggesting JS exceptions
    const jsErrorTexts = consoleMessages
      .filter((m) => m.type === 'error')
      .map((m) => m.text)
      .filter(Boolean);
    if (jsErrorTexts.length > 0) bpScore -= Math.min(jsErrorTexts.length * 3, 15);

    bpScore = Math.max(0, Math.min(100, Math.round(bpScore)));

    // --- SEO Score ---
    let seoScore = 0;

    // Title tag
    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(htmlContent);
    const hasTitle = !!titleMatch;
    if (hasTitle) {
      seoScore += 20;
      const titleText = titleMatch[1].trim();
      if (titleText.length >= 10 && titleText.length <= 70) seoScore += 15;
    }

    // Meta description
    const metaDescRegex = /<meta\s[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i;
    const altMetaDescRegex = /<meta\s[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["'][^>]*\/?>/i;
    const hasMetaDesc =
      metaDescRegex.test(htmlContent) || altMetaDescRegex.test(htmlContent);
    if (hasMetaDesc) seoScore += 20;

    // H1 presence
    if (hasH1) seoScore += 15;

    // Viewport meta (important for mobile SEO)
    if (hasViewport) seoScore += 15;

    // No broken links (no failed responses among navigation-like requests)
    const brokenLinks = networkRequests.filter(
      (r) =>
        r.status >= 400 &&
        r.status < 600 &&
        (r.resourceType === 'document' || r.resourceType === 'xhr' || r.resourceType === 'fetch'),
    ).length;
    if (brokenLinks === 0) seoScore += 15;
    else seoScore -= Math.min(brokenLinks * 5, 15);

    seoScore = Math.max(0, Math.min(100, Math.round(seoScore)));

    return { performance: perfScore, accessibility: accScore, bestPractices: bpScore, seo: seoScore };
  }

  private async fetchSitemap(targetUrl: string): Promise<SitemapInfo> {
    try {
      const sitemapUrl = new URL('/sitemap.xml', targetUrl).href;
      const response = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return { found: false };
      }

      const xml = await response.text();
      const urls: string[] = [];
      const locRegex = /<loc[^>]*>([^<]+)<\/loc>/gi;
      let match: RegExpExecArray | null;

      while ((match = locRegex.exec(xml)) !== null) {
        urls.push(match[1].trim());
      }

      if (urls.length === 0) {
        return { found: false };
      }

      return { found: true, urlCount: urls.length, urls };
    } catch {
      return { found: false };
    }
  }

  private async fetchRobotsTxt(targetUrl: string): Promise<RobotsInfo> {
    try {
      const robotsUrl = new URL('/robots.txt', targetUrl).href;
      const response = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return { found: false };
      }

      const text = await response.text();
      const disallowed: string[] = [];
      const sitemaps: string[] = [];

      const directiveRegex = /^\s*(disallow|sitemap)\s*:\s*(.+)\s*$/gim;
      let match: RegExpExecArray | null;

      while ((match = directiveRegex.exec(text)) !== null) {
        const field = match[1].toLowerCase();
        const value = match[2].trim();
        if (value.length === 0) continue;

        if (field === 'disallow') {
          disallowed.push(value);
        } else if (field === 'sitemap') {
          sitemaps.push(value);
        }
      }

      return { found: true, disallowed, sitemaps };
    } catch {
      return { found: false };
    }
  }
}
