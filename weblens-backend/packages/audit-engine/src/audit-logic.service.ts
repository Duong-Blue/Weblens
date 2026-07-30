import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { TechDetectorService } from '@weblens/tech-detector';
import { CrawlResult, NetworkRequest, ConsoleMessageEntry } from './interfaces/crawl-result.interface';
import {
  ComprehensiveAuditData, PerfDetails, SeoDetails, AccDetails,
  SecurityDetails, NetworkDetails, StructureDetails, JsErrorsDetails, UiUxDetails
} from './interfaces/comprehensive-audit-data.interface';


@Injectable()
export class AuditLogicService {
  private readonly techDetector = new TechDetectorService();

  async performComprehensiveAudit(crawlData: CrawlResult, url: string): Promise<ComprehensiveAuditData> {
    const $ = cheerio.load(crawlData.htmlContent);

    // 1. Performance details (scoring moved to PerfEngineService)
    const loadTime = crawlData.performanceTiming.loadEventEnd - crawlData.performanceTiming.navigationStart;
    
    // Performance Budget Analysis
    const totalRequestCount = crawlData.networkRequests.length;
    let htmlSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    
    // Playwright route intercept might not have accurate sizing, fallback to count approximation
    for (const req of crawlData.networkRequests) {
        if (req.resourceType === 'document') htmlSize++;
        else if (req.resourceType === 'script') jsSize++;
        else if (req.resourceType === 'stylesheet') cssSize++;
        else if (req.resourceType === 'image') imageSize++;
    }
    const totalSize = htmlSize + jsSize + cssSize + imageSize;

    const cwv = (crawlData as any).cwv || {};

    const perfDetails: PerfDetails = {
      loadTimeMs: loadTime,
      timing: crawlData.performanceTiming,
      heavyResources: crawlData.networkRequests.filter(r => r.resourceType === 'image' || r.resourceType === 'script').length,
      budget: {
        totalSize,
        htmlSize,
        jsSize,
        cssSize,
        imageSize,
        totalRequestCount
      },
      coreWebVitals: {
        lcp: cwv.lcp,
        cls: cwv.cls,
        inp: cwv.inp
      }
    };

    // 2. SEO
    const title = $('title').text();
    const hasTitle = title.length > 0;
    const description = $('meta[name="description"]').attr('content');
    const hasMetaDescription = !!description;
    const hasH1 = $('h1').length > 0;
    
    let seoScore = 0;
    if (hasTitle) seoScore += 25;
    if (hasMetaDescription) seoScore += 25;
    if (hasH1) seoScore += 10;

    // Social Media Meta Analysis
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const twitterDescription = $('meta[name="twitter:description"]').attr('content');
    
    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;

    if (ogTitle || ogDescription || ogImage) seoScore += 15;
    if (twitterCard || twitterTitle || twitterDescription) seoScore += 10;
    if (hasJsonLd) seoScore += 15;

    const seoDetails: SeoDetails = {
      title,
      hasTitle,
      description,
      hasMetaDescription,
      hasH1,
      h1Count: $('h1').length,
      linksCount: $('a').length,
      social: {
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          image: ogImage
        },
        twitter: {
          card: twitterCard,
          title: twitterTitle,
          description: twitterDescription
        },
        hasJsonLd
      }
    };

    // 3. Accessibility
    // 3a. Image alt-text check (existing)
    const imagesWithoutAlt = $('img:not([alt])').length;
    const totalImages = $('img').length;
    const altScore = totalImages > 0 ? Math.max(0, 100 - (imagesWithoutAlt / totalImages * 100)) : 100;

    // 3b. WCAG Check — ARIA Landmarks (semantic elements + explicit role attributes)
    const landmarkTags = ['main', 'nav', 'header', 'footer', 'aside'];
    const presentLandmarks = landmarkTags.filter(tag => $(tag).length > 0);
    const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region'];
    const roleLandmarks = landmarkRoles.filter(role => $(`[role="${role}"]`).length > 0);
    const uniqueLandmarkCount = new Set([...presentLandmarks, ...roleLandmarks]).size;
    const hasLandmarks = uniqueLandmarkCount >= 2;
    const landmarkScore = hasLandmarks ? 100 : (uniqueLandmarkCount > 0 ? 50 : 0);

    // 3c. WCAG Check — Form Input Labels
    const inputs = $('input').filter((_i, el) => {
      const type = $(el).attr('type')?.toLowerCase();
      return !type || (type !== 'hidden' && type !== 'submit' && type !== 'button' && type !== 'reset');
    });
    let labeledInputs = 0;
    const totalInputs = inputs.length;
    inputs.each((_i, el) => {
      const $el = $(el);
      if ($el.attr('aria-label') || $el.attr('aria-labelledby')) {
        labeledInputs++;
        return;
      }
      if ($el.closest('label').length > 0) {
        labeledInputs++;
        return;
      }
      // label[for="id"] association requires CSS.escape for IDs with special chars
      const id = $el.attr('id');
      if (id && $(`label[for="${CSS.escape(id)}"]`).length > 0) {
        labeledInputs++;
      }
    });
    const labelScore = totalInputs > 0 ? (labeledInputs / totalInputs) * 100 : 100;

    // 3d. WCAG Check — Heading Order
    const headingEls = $('h1, h2, h3, h4, h5, h6').toArray();
    let headingOrderValid = true;
    let lastLevel = 0;
    for (const el of headingEls) {
      const level = parseInt($(el).prop('tagName').slice(1), 10);
      if (lastLevel > 0 && level - lastLevel > 1) {
        headingOrderValid = false;
        break;
      }
      lastLevel = level;
    }
    const headingScore = headingOrderValid ? 100 : 0;

    // 3e. WCAG Check — Link Accessible Names
    const linkEls = $('a[href]');
    let linksWithNames = 0;
    const totalLinks = linkEls.length;
    linkEls.each((_i, el) => {
      const $el = $(el);
      // Has text content, aria-label, aria-labelledby, or an <img> with alt inside
      if (
        $el.text().trim() ||
        $el.attr('aria-label') ||
        $el.attr('aria-labelledby') ||
        $el.find('img[alt]').length > 0
      ) {
        linksWithNames++;
      }
    });
    const linkNameScore = totalLinks > 0 ? (linksWithNames / totalLinks) * 100 : 100;

    const formControls = $('button, input');
    const staticallyDisabledControls = formControls.filter((_i, el) => {
      return $(el).attr('disabled') !== undefined || $(el).attr('aria-disabled') === 'true';
    }).length;
    const formControlScore = staticallyDisabledControls === 0 ? 100 : Math.max(0, 100 - (staticallyDisabledControls * 10));

    const allElementsWithTabindex = $('[tabindex]');
    const elementsWithPositiveTabindex = allElementsWithTabindex.filter((_i, el) => {
      const ti = parseInt($(el).attr('tabindex') || '0', 10);
      return !isNaN(ti) && ti > 0;
    }).length;
    const tabindexScore = elementsWithPositiveTabindex === 0 ? 100 : 0;

    const elementsWithOutlineNone = $('[style*="outline"]').filter((_i, el) => {
      const style = $(el).attr('style') || '';
      return /outline\s*:\s*(none|0)/i.test(style);
    }).length;
    const focusRingScore = elementsWithOutlineNone === 0 ? 100 : 0;

    // 3f. Build WCAG criteria array
    const wcagCriteria = [
      {
        criteria: 'alt-text',
        passed: imagesWithoutAlt === 0,
        message: totalImages === 0 
          ? 'No images found' 
          : `${totalImages - imagesWithoutAlt}/${totalImages} images have alt text attributes`
      },
      {
        criteria: 'aria-landmarks',
        passed: hasLandmarks,
        message: hasLandmarks
          ? `Page uses ${uniqueLandmarkCount} ARIA landmark(s): ${Array.from(new Set([...presentLandmarks, ...roleLandmarks])).join(', ')}`
          : 'Page does not use semantic landmark elements (<main>, <nav>, <header>, <footer>, <aside>) or ARIA landmark roles. This helps screen reader users navigate the page.'
      },
      {
        criteria: 'input-labels',
        passed: totalInputs === 0 || labeledInputs === totalInputs,
        message: totalInputs === 0
          ? 'No form inputs found'
          : `${labeledInputs}/${totalInputs} form inputs have associated labels or aria-label`
      },
      {
        criteria: 'heading-order',
        passed: headingOrderValid,
        message: headingOrderValid
          ? 'Headings are in a valid hierarchical order'
          : 'Heading order is skipped (e.g., h1 to h3). Headings should not skip levels for proper document outline.'
      },
      {
        criteria: 'link-names',
        passed: totalLinks === 0 || linkNameScore >= 90,
        message: totalLinks === 0
          ? 'No links found'
          : `${Math.round(linkNameScore)}% of links have accessible names`
      },
      {
        criteria: 'form-controls-disabled',
        passed: staticallyDisabledControls === 0,
        message: staticallyDisabledControls === 0
          ? 'No statically disabled form controls found'
          : `Found ${staticallyDisabledControls} statically disabled form control(s). Consider handling via CSS or JS to improve accessibility for screen readers.`
      },
      {
        criteria: 'tabindex-positive',
        passed: elementsWithPositiveTabindex === 0,
        message: elementsWithPositiveTabindex === 0
          ? 'No elements with positive tabindex found'
          : `Found ${elementsWithPositiveTabindex} element(s) with a tabindex > 0. This is an anti-pattern that breaks the natural keyboard navigation flow.`
      },
      {
        criteria: 'focus-ring',
        passed: elementsWithOutlineNone === 0,
        message: elementsWithOutlineNone === 0
          ? 'No elements found with "outline: none" or "outline: 0"'
          : `Found ${elementsWithOutlineNone} element(s) with "outline: none" or "outline: 0". Removing focus rings creates accessibility issues for keyboard users.`
      },
      {
        criteria: 'contrast-hints',
        passed: true,
        message: 'Ensure text contrast ratio meets WCAG 2.1 AA (4.5:1 for normal text). Visual rendering is required for full validation.'
      }
    ];

    // 3j. Composite accessibility score (average of all sub-scores)
    const accScore = Math.round((altScore + landmarkScore + labelScore + headingScore + linkNameScore + formControlScore + tabindexScore + focusRingScore) / 8);

    const accDetails: AccDetails = {
      imagesWithoutAlt,
      totalImages,
      missingAriaLabels: $('button:not([aria-label]):not(:has(text))').length,
      wcag: wcagCriteria
    };

    // 4. Security
    const isHttps = url.startsWith('https');
    const headers = crawlData.mainHeaders || {};
    const hasCsp = !!headers['content-security-policy'];
    const hasHsts = !!headers['strict-transport-security'];
    const hasXfo = !!headers['x-frame-options'];
    const hasXcto = !!headers['x-content-type-options'];

    // 4a. Form Security
    let insecureAction = 0;
    let insecurePasswordInput = 0;
    let missingAutocompletePassword = 0;

    $('form').each((_i, el) => {
      const action = $(el).attr('action');
      if (action && action.startsWith('http://')) {
        insecureAction++;
      }
    });

    $('input[type="password"]').each((_i, el) => {
      if (!isHttps) {
        insecurePasswordInput++;
      }
      const autocomplete = $(el).attr('autocomplete');
      if (autocomplete !== 'current-password' && autocomplete !== 'new-password') {
        missingAutocompletePassword++;
      }
    });

    // 4b. Cookie Security
    let totalCookies = 0;
    let missingSecure = 0;
    let missingHttpOnly = 0;
    let missingSameSite = 0;

    const setCookieHeader = headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookieHeader) 
      ? setCookieHeader 
      : (typeof setCookieHeader === 'string' ? [setCookieHeader] : []);

    cookies.forEach(cookieStr => {
      totalCookies++;
      const lowerCookie = cookieStr.toLowerCase();
      if (!lowerCookie.includes('secure')) missingSecure++;
      if (!lowerCookie.includes('httponly')) missingHttpOnly++;
      if (!lowerCookie.includes('samesite')) missingSameSite++;
    });

    // 4c. CORS Security
    const allowOrigin = headers['access-control-allow-origin'] as string | undefined;
    const wildcardOrigin = allowOrigin === '*';

    const presentHeaders = [hasCsp, hasHsts, hasXfo, hasXcto].filter(Boolean).length;
    let securityScore = isHttps
      ? Math.round(40 + (presentHeaders / 4) * 60)
      : Math.round((presentHeaders / 4) * 60);

    // Apply penalties
    if (insecureAction > 0) securityScore -= 10;
    if (insecurePasswordInput > 0) securityScore -= 20; // Critical
    if (missingAutocompletePassword > 0) securityScore -= 5;
    
    if (totalCookies > 0) {
      if (missingSecure > 0) securityScore -= 5;
      if (missingHttpOnly > 0) securityScore -= 5;
      if (missingSameSite > 0) securityScore -= 5;
    }

    if (wildcardOrigin) securityScore -= 10;

    const { vulnerabilities, scorePenalty } = this.scanVulnerableLibraries($);
    securityScore = Math.max(0, securityScore - scorePenalty);

    const securityDetails: SecurityDetails = {
      isHttps,
      mixedContent: crawlData.networkRequests.some(r => r.url.startsWith('http://')) && isHttps,
      headers: {
        contentSecurityPolicy: hasCsp,
        strictTransportSecurity: hasHsts,
        xFrameOptions: hasXfo,
        xContentTypeOptions: hasXcto,
      },
      forms: {
        insecureAction,
        insecurePasswordInput,
        missingAutocompletePassword,
      },
      cookies: {
        total: totalCookies,
        missingSecure,
        missingHttpOnly,
        missingSameSite,
      },
      cors: {
        wildcardOrigin,
      },
      vulnerabilities,
    };

    // 5. Technology Stack
    const techStack = this.techDetector.detect(crawlData.htmlContent, crawlData.mainHeaders || {});

    // 6. Network & Resources
    const networkDetails: NetworkDetails = {
      totalRequests: crawlData.networkRequests.length,
      failedRequests: crawlData.networkRequests.filter(r => r.status >= 400).length,
      summaryByType: crawlData.networkRequests.reduce((acc, req) => {
        acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // 7. Website Structure
    const internalLinks = $('a').filter((i, el) => {
      const href = $(el).attr('href');
      return !!href && (href.startsWith('/') || href.includes(new URL(url).hostname));
    }).length;
    
    const structureDetails: StructureDetails = {
      internalLinks,
      externalLinks: $('a').length - internalLinks,
      headingHierarchy: {
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length
      }
    };

    // 8. JavaScript & Errors
    const jsErrorsDetails: JsErrorsDetails = {
      errorCount: crawlData.consoleMessages.filter(m => m.type === 'error').length,
      warningCount: crawlData.consoleMessages.filter(m => m.type === 'warning').length,
      errors: crawlData.consoleMessages.filter(m => m.type === 'error') as any[]
    };

    // 9. UI/UX (Raw data for AI Analysis)
    const uiUxDetails: UiUxDetails = {
      viewportMeta: !!$('meta[name="viewport"]').attr('content'),
      buttonCount: $('button').length,
      formCount: $('form').length,
      hasNavigation: $('nav').length > 0 || $('header').length > 0
    };

    return {
      perfDetails,
      seoScore, seoDetails,
      accScore, accDetails,
      securityScore, securityDetails,
      techStack,
      networkDetails,
      structureDetails,
      jsErrorsDetails,
      uiUxDetails
    };
  }

  private scanVulnerableLibraries($: cheerio.Root): { vulnerabilities: { name: string; severity: string; description: string }[]; scorePenalty: number } {
    const vulnerabilities: { name: string; severity: string; description: string }[] = [];
    let scorePenalty = 0;
    const detected = new Set<string>();

    const LIB_PATTERNS = [
      {
        name: 'jQuery (1.x)',
        severity: 'critical',
        regex: /jquery[\/.-]?1\.\d+/i,
        description: 'jQuery 1.x has known security vulnerabilities (CVE-2020-11023, CVE-2020-11022). Upgrade to 3.5+.',
        penalty: 30,
      },
      {
        name: 'jQuery (2.x)',
        severity: 'critical',
        regex: /jquery[\/.-]?2\.\d+/i,
        description: 'jQuery 2.x has known security vulnerabilities (CVE-2020-11023, CVE-2020-11022). Upgrade to 3.5+.',
        penalty: 30,
      },
      {
        name: 'jQuery (3.0-3.4)',
        severity: 'high',
        regex: /jquery[\/.-]?3\.[0-4]/i,
        description: 'jQuery 3.0-3.4.x has known prototype pollution vulnerabilities (CVE-2020-11023). Upgrade to 3.5+.',
        penalty: 15,
      },
    ] as const;

    const scriptEls = $('script[src]').toArray();
    for (const el of scriptEls) {
      const src = $(el).attr('src') || '';
      for (const pattern of LIB_PATTERNS) {
        if (pattern.regex.test(src) && !detected.has(pattern.name)) {
          detected.add(pattern.name);
          vulnerabilities.push({
            name: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
          });
          scorePenalty += pattern.penalty;
        }
      }
    }

    return { vulnerabilities, scorePenalty };
  }

  async auditSeo(html: string) {
    const $ = cheerio.load(html);
    const hasTitle = $('title').length > 0;
    const hasMetaDescription = $('meta[name="description"]').length > 0;
    return {
      seoScore: (hasTitle ? 50 : 0) + (hasMetaDescription ? 50 : 0),
      summary: hasTitle && hasMetaDescription ? 'SEO is good.' : 'Missing SEO tags.',
    };
  }
}
