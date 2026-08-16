import { EngineContext } from '../../shared/engine.types';
import { SeoCheckResult, SeoRule, extractHostname } from '../seo-rules';
import * as cheerio from 'cheerio';

export const InternalLinkingRule: SeoRule = {
  id: 'SEO-015',
  ruleId: 'internal-external-link-ratio',
  severity: 'low',
  weight: 10,
  title: 'Page maintains a healthy internal vs external link ratio',
  impact: 'Internal links distribute authority and improve crawling; pages dominated by external links dilute their SEO value.',
  recommendation: 'Keep the majority of links internal and use rel="nofollow" where appropriate for external links.',
  evidenceType: 'html-element',
  additivePoints: 10,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);
    
    // We can't access non-exported extractHostname easily, so duplicate its simple logic here or export it
    // Assuming we will export it from seo-rules.ts in a subsequent edit
    const pageHost = extractHostname(ctx.url || ctx.crawlData?.url || '');

    const hrefs = $('a[href]')
      .toArray()
      .map((el) => $(el).attr('href') || '')
      .map((href) => href.trim())
      .filter((href) => {
        const lower = href.toLowerCase();
        return (
          !lower.startsWith('#') &&
          !lower.startsWith('javascript:') &&
          !lower.startsWith('mailto:') &&
          !lower.startsWith('tel:')
        );
      });

    if (hrefs.length === 0) {
      return {
        passed: true,
        actual: 'No links found on the page',
        expected: 'Page should contain a mix of internal and external links',
        summary: 'No links to analyze.',
        points: 0,
      };
    }

    let internal = 0;
    let external = 0;
    for (const href of hrefs) {
      if (
        href.startsWith('/') ||
        href.startsWith('./') ||
        href.startsWith('../')
      ) {
        internal++;
        continue;
      }
      try {
        const resolved = new URL(href, ctx.url);
        if (pageHost && resolved.hostname.toLowerCase() === pageHost) {
          internal++;
        } else {
          external++;
        }
      } catch {
        internal++;
      }
    }

    const internalRatio = internal / hrefs.length;
    let passed = false;
    let points = 0;
    
    // Diagnostic scoring (Heuristic)
    if (internalRatio >= 0.3) {
        passed = true;
        points = 10;
    } else if (internalRatio >= 0.15) {
        passed = false;
        points = 5;
    } else {
        passed = false;
        points = 0;
    }

    // Pass this data along to context for prompt-builder
    if (ctx.seoDetails) {
        ctx.seoDetails.linksCount = { internal, external, total: hrefs.length };
    }

    return {
      passed,
      actual: `${internal} internal, ${external} external link(s) (${Math.round(
        internalRatio * 100
      )}% internal)`,
      expected: 'At least 30% of links should point to internal pages',
      summary: passed
        ? 'Internal/external link balance is healthy.'
        : 'External links dominate the page; consider adding more internal links.',
      points,
    };
  },
};
