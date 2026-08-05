import { Injectable } from '@nestjs/common';
import { LighthouseData, CrawlResult } from '../../interfaces/crawl-result.interface';

export type FallbackEngineInput = Pick<CrawlResult, 'performanceTiming' | 'cwv' | 'networkRequests' | 'consoleMessages' | 'htmlContent'>;

@Injectable()
export class FallbackLighthouseEngine {
  score(data: FallbackEngineInput): LighthouseData {
    const htmlContent = data.htmlContent || '';
    const consoleMessages = data.consoleMessages || [];
    const networkRequests = data.networkRequests || [];

    let accessibility = 100;
    let bestPractices = 100;
    let seo = 100;

    // Accessibility
    const hasViewport = /<meta[^>]+name="?viewport"?/i.test(htmlContent);
    if (!hasViewport) accessibility -= 20;

    const imgMatches = htmlContent.match(/<img[^>]+>/gi) || [];
    const imgWithAlt = imgMatches.filter(m => /alt=/i.test(m)).length;
    if (imgMatches.length > 0) {
      const ratio = imgWithAlt / imgMatches.length;
      accessibility -= Math.round((1 - ratio) * 30);
    }

    const hasHeadings = /<h[1-6][^>]*>/i.test(htmlContent);
    if (!hasHeadings) accessibility -= 15;

    const errors = consoleMessages.filter(m => m.type === 'error' && m.text);
    accessibility -= Math.min(errors.length * 5, 20);

    const hasLang = /<html[^>]+lang="?[a-zA-Z]{2,3}"?/i.test(htmlContent);
    if (!hasLang) accessibility -= 10;

    accessibility = Math.max(0, Math.min(100, accessibility));

    // Best Practices
    bestPractices -= Math.min(errors.length * 5, 30);
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    bestPractices -= Math.min(warnings.length * 2, 10);

    const hasDoctype = /<!doctype/i.test(htmlContent);
    if (!hasDoctype) bestPractices -= 10;

    if (!hasViewport) bestPractices -= 10;

    const hasDeprecatedTags = /<(applet|bgsound|dir|font|frame|frameset|marquee|noembed|plaintext|rbstrike|xmp|center)/i.test(htmlContent);
    if (hasDeprecatedTags) bestPractices -= 10;

    const jsErrorTexts = errors.map(e => e.text).filter(Boolean);
    bestPractices -= Math.min(jsErrorTexts.length * 3, 15);

    bestPractices = Math.max(0, Math.min(100, bestPractices));

    // SEO
    seo = 0;
    const titleMatch = htmlContent.match(/<title[^>]*>(.*)<\/title>/i);
    if (titleMatch) {
      const titleLength = titleMatch[1].trim().length;
      if (titleLength > 0) seo += 20;
      if (titleLength >= 10 && titleLength <= 70) seo += 15;
    }

    const metaDescRegex = /<meta[^>]+description[^>]+content="[^"]+"/i;
    const altMetaDescRegex = /<meta[^>]+content="[^"]+"[^>]+description/i;
    if (metaDescRegex.test(htmlContent) || altMetaDescRegex.test(htmlContent)) {
      seo += 20;
    }

    const hasH1 = /<h1[^>]*>/i.test(htmlContent);
    if (hasH1) seo += 15;
    if (hasViewport) seo += 15;

    const brokenLinks = networkRequests.filter(r => 
      r.status >= 400 && r.status < 600 && 
      (r.resourceType === 'document' || r.resourceType === 'xhr' || r.resourceType === 'fetch')
    );
    
    if (brokenLinks.length === 0) seo += 15;
    else seo -= Math.min(brokenLinks.length * 5, 15);

    seo = Math.max(0, Math.min(100, seo));

    return { source: 'fallback', performance: null, accessibility, bestPractices, seo };
  }
}
