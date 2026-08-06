import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import type { Request } from 'playwright';
import { URL } from 'url';
// We need to dynamically import get-port since it's an ESM package
// const getPort = require('get-port');
import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns';
import {
  CrawlSession,
  ConsoleMessageEntry,
  NetworkRequest,
  LighthouseData,
  ScreenshotItem,
} from '@weblens/audit-engine';

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
export const MAX_SCROLLS = 20;
export const MAX_SCROLL_TIME_MS = 15000;
export const CWV_SCRIPT = `
window.__cwv = { lcp: undefined, inp: undefined, cls: 0 };

try {
  new PerformanceObserver(function(list) {
    var entries = list.getEntries();
    if (entries.length > 0) {
      window.__cwv.lcp = entries[entries.length - 1].startTime;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch (e) {}

  // Capture INP (Note: requires user interaction; remains undefined in automated crawls).
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
  // Cumulative Layout Shift via the web-vitals session-window algorithm
  // (mirrors LayoutShiftManager._processEntry): a session continues while the
  // gap to the previous entry is < 1s AND the span from the session's first
  // entry is < 5s; otherwise a new session starts. The final session value is
  // reported.
  var clsSessionValue = 0;
  var clsSessionEntries = [];
  new PerformanceObserver(function(list) {
    for (var i = 0; i < list.getEntries().length; i++) {
      var entry = list.getEntries()[i];
      if (entry.hadRecentInput) {
        continue;
      }
      var firstSessionEntry = clsSessionEntries[0];
      var lastSessionEntry =
        clsSessionEntries[clsSessionEntries.length - 1];
      if (
        clsSessionValue &&
        firstSessionEntry &&
        lastSessionEntry &&
        entry.startTime - lastSessionEntry.startTime < 1000 &&
        entry.startTime - firstSessionEntry.startTime < 5000
      ) {
        clsSessionValue += entry.value;
        clsSessionEntries.push({
          startTime: entry.startTime,
          value: entry.value,
        });
      } else {
        clsSessionValue = entry.value;
        clsSessionEntries = [
          { startTime: entry.startTime, value: entry.value },
        ];
      }
    }
    window.__cwv.cls = clsSessionValue;
  }).observe({ type: 'layout-shift', buffered: true });
} catch (e) {}
`;

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  private async validateDomain(url: string): Promise<void> {
    const hostname = new URL(url).hostname;
    try {
      await dns.promises.resolve(hostname);
    } catch (error) {
      throw new Error(
        'ERR_NAME_NOT_RESOLVED: Cannot resolve domain ' + hostname,
      );
    }
  }

  async crawl(url: string): Promise<CrawlSession> {
    await this.validateDomain(url);
    // Import get-port dynamically at runtime since it's an ESM package
    const { default: getPort } = await (eval(
      'import("get-port")',
    ) as Promise<any>);
    const port = await getPort();
    const browser: Browser = await chromium.launch({
      headless: true,
      args: ['--remote-debugging-port=' + port],
    });

    let success = false;
    try {
      const page: Page = await browser.newPage();

      const networkRequestsMap = new Map<Request, NetworkRequest>();
      const consoleMessages: ConsoleMessageEntry[] = [];

      // Collect network requests
      page.on('request', (request) => {
        networkRequestsMap.set(request, {
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          status: 0,
          statusText: '',
          startTime: performance.now(),
          requestHeaders: request.headers(),
        });
      });

      page.on('response', async (response) => {
        const req = networkRequestsMap.get(response.request());
        if (req) {
          req.status = response.status();
          req.statusText = response.statusText();
          req.endTime = performance.now();
          req.duration = req.startTime
            ? req.endTime - req.startTime
            : undefined;
          req.responseHeaders = response.headers();

          try {
            const timing = response.request().timing();
            if (timing) {
              req.dnsLookupMs =
                timing.domainLookupEnd - timing.domainLookupStart;
              req.tcpConnectionMs = timing.connectEnd - timing.connectStart;
              req.tlsNegotiationMs = timing.secureConnectionStart
                ? timing.connectEnd - timing.secureConnectionStart
                : undefined;
              req.timeToFirstByteMs =
                timing.responseStart - timing.requestStart;
            }
          } catch (e) {}

          const serverHeader = await response.serverAddr().catch(() => null);
          if (serverHeader) {
            req.remoteAddress =
              serverHeader.ipAddress + ':' + serverHeader.port;
          }

          const securityDetails = await response
            .securityDetails()
            .catch(() => null);
          if (securityDetails) {
            req.protocol = securityDetails.protocol;
          }

          try {
            const sizes = await response.request().sizes();
            if (sizes) {
              req.transferSize =
                sizes.responseHeadersSize + sizes.responseBodySize;
              req.encodedBodySize = sizes.responseBodySize;
            }
          } catch (e) {}
        }
      });

      // Collect console messages
      page.on('console', (msg) => {
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

      const mainHeaders: Record<string, string> = response
        ? response.headers()
        : {};

      await this.scrollPageWithLazyLoad(page);

      await page.waitForTimeout(3000);

      const screenshots = await this.captureSerpScreenshots(browser, url);

      const cwvRaw = await page.evaluate(() =>
        JSON.stringify(
          (window as any).__cwv || { lcp: undefined, inp: undefined, cls: 0 },
        ),
      );
      let cwv: {
        lcp?: number;
        inp?: number;
        cls?: number;
        fcp?: number;
        ttfb?: number;
      };
      try {
        cwv = JSON.parse(cwvRaw);
        if (cwv.inp === undefined) {
          this.logger.log(
            'INP not collected for ' +
              url +
              ": requires real user interaction; report shows 'no data'",
          );
        }
      } catch {
        cwv = { lcp: undefined, inp: undefined, cls: 0 };
      }

      // Get performance timings
      const performanceTiming = await page.evaluate(() =>
        JSON.stringify(window.performance.timing),
      );
      const parsedTiming = JSON.parse(performanceTiming);

      const content = await page.content();

      // Fetch sitemap.xml relative to target URL
      const sitemapInfo = await this.fetchSitemap(url);

      // Fetch robots.txt relative to target URL
      const robotsInfo = await this.fetchRobotsTxt(url);

      const networkRequests = Array.from(networkRequestsMap.values());

      const crawlResult = {
        htmlContent: content,
        networkRequests,
        consoleMessages,
        performanceTiming: parsedTiming,
        sitemapInfo,
        robotsInfo,
        cwv,
        lighthouseData: undefined as any,
        mainHeaders,
        screenshots,
        page,
        browser,
      };

      let lighthouseData: LighthouseData | null;
      try {
        this.logger.log(
          'Running Lighthouse for ' + url + ' on port ' + port + '...',
        );
        const lhModule: any = await eval("import('lighthouse')");
        const lighthouseFn = lhModule.default || lhModule;
        const lhResult = await lighthouseFn(url, {
          port,
          output: 'json',
          onlyCategories: [
            'performance',
            'accessibility',
            'best-practices',
            'seo',
          ],
          disableStorageReset: true,
        });

        if (!lhResult || !lhResult.lhr || !lhResult.lhr.categories) {
          throw new Error('Invalid Lighthouse result structure');
        }

        const categories = lhResult.lhr.categories;
        lighthouseData = {
          source: 'lighthouse',
          performance:
            categories.performance?.score != null
              ? Math.round(categories.performance.score * 100)
              : null,
          accessibility: Math.round(
            (categories.accessibility?.score ?? 0) * 100,
          ),
          bestPractices: Math.round(
            (categories['best-practices']?.score ?? 0) * 100,
          ),
          seo: Math.round((categories.seo?.score ?? 0) * 100),
        };
        this.logger.log(`Lighthouse completed successfully for ${url}`);
      } catch (error) {
        this.logger.error(`Lighthouse failed for ${url}:`, error);
        lighthouseData = null;
        this.logger.log(
          `Used fallback simulated Lighthouse data for ${url} due to failure.`,
        );
      }

      crawlResult.lighthouseData = lighthouseData;

      success = true;
      return crawlResult;
    } finally {
      if (!success) {
        await browser.close().catch(() => {});
      }
    }
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
    const startMs = Date.now();
    let loopTripWarned = false;

    while (
      scrolledDistance < pageHeight - viewportHeight &&
      scrollCount < MAX_SCROLLS &&
      Date.now() - startMs < MAX_SCROLL_TIME_MS
    ) {
      await page.evaluate(
        (y: number) => window.scrollTo(0, y),
        scrolledDistance + scrollStep,
      );
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

    if (!loopTripWarned && scrolledDistance < pageHeight - viewportHeight) {
      loopTripWarned = true;
      this.logger.warn(
        `Infinite scroll suspected: reached bound at scroll ${scrollCount} for this page`,
      );
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }

  private async captureSerpScreenshots(
    browser: Browser,
    url: string,
    serpBaseUrl: string = process.env.SERP_BASE_URL || 'https://www.google.com',
  ): Promise<ScreenshotItem[]> {
    try {
      const reportDir =
        process.env.REPORTS_DIR || path.resolve(process.cwd(), 'reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const domain = new URL(url).hostname;
      const timestamp = Date.now();
      const screenshotDir = path.join(reportDir, domain, timestamp.toString());
      fs.mkdirSync(screenshotDir, { recursive: true });

      const devices = [
        {
          device: 'desktop',
          contextOptions: { viewport: { width: 1920, height: 1080 } },
        },
        {
          device: 'mobile',
          contextOptions: {
            viewport: { width: 375, height: 812 },
            userAgent:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            isMobile: true,
            hasTouch: true,
          },
        },
      ];

      const screenshots: ScreenshotItem[] = [];

      for (const { device, contextOptions } of devices) {
        let ctx;
        try {
          ctx = await browser.newContext(contextOptions);
          const pg = await ctx.newPage();

          // Pre-seed Google CONSENT cookie to reduce consent popups.
          await ctx
            .addCookies([
              {
                name: 'CONSENT',
                value: 'YES+',
                domain: '.google.com',
                path: '/',
              },
            ])
            .catch(() => {});

          const searchUrl = `${serpBaseUrl}/search?q=${encodeURIComponent(domain)}`;
          await pg.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          // Broad consent-button matcher across regions/languages.
          const consentRe =
            /accept all|agree to all|i agree|tôi đồng ý|tôi chấp nhận|chấp nhận tất cả|đồng ý|alle akzeptieren|accepter tout|accepter/i;
          const consentButton = pg
            .getByRole('button', { name: consentRe })
            .first();
          if ((await consentButton.count()) > 0) {
            await consentButton.click({ timeout: 3000 }).catch(() => {});
          }
          await pg.waitForTimeout(2500);

          if (!(await this.hasSerpResults(pg, domain))) {
            this.logger.warn(
              `No SERP results found for ${domain} on ${device}`,
            );
            continue;
          }

          const buf = await pg.screenshot({
            path: path.join(screenshotDir, `serp-${device}.png`),
            fullPage: false,
          });

          screenshots.push({
            viewport: device,
            path: `${domain}/${timestamp}/serp-${device}.png`,
            width: contextOptions.viewport.width,
            height: contextOptions.viewport.height,
            fileSize: buf.length,
            format: 'png',
            timestamp: Date.now(),
            takenAtMs: 0,
          });
        } catch (deviceError) {
          this.logger.warn(
            `Failed to capture ${device} SERP screenshot for ${domain}: ${deviceError.message}`,
          );
        } finally {
          if (ctx) await ctx.close().catch(() => {});
        }
      }

      return screenshots;
    } catch (e) {
      this.logger.warn(`SERP screenshot failed for ${url}: ${e.message}`);
      return [];
    }
  }

  /**
   * Detects whether the loaded page actually shows SERP results.
   * Layer 1 is the Google results container; layers 2-3 are fallbacks that
   * match result links pointing at the queried domain or via Google's /url
   * redirect. Skips only when all three layers fail.
   */
  private async hasSerpResults(pg: Page, domain: string): Promise<boolean> {
    const layers = [
      pg.locator('#search, #rso').first(),
      pg.locator(`a[href*="${domain}"]`).first(),
      pg.locator('a[href*="/url?q="]').first(),
    ];
    for (const layer of layers) {
      if ((await layer.count()) > 0) {
        return true;
      }
    }
    return false;
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
