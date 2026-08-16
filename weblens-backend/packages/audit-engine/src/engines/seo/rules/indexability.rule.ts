import { EngineContext } from '../../shared/engine.types';
import { SeoCheckResult, SeoRule } from '../seo-rules';
import * as cheerio from 'cheerio';

/**
 * Checks if a page is explicitly blocked from indexing via robots meta tags.
 */
function isBlockedByRobotsMeta($: cheerio.CheerioAPI | cheerio.Root): boolean {
  let isBlocked = false;
  $('meta[name="robots"]').each((_, el) => {
    const content = $(el).attr('content')?.toLowerCase() || '';
    if (content.includes('noindex') || content.includes('none')) {
      isBlocked = true;
    }
  });
  return isBlocked;
}

function normalizeCanonicalKey(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    url.search = '';
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.href;
  } catch {
    return null;
  }
}

export const IndexabilityRule: SeoRule = {
  id: 'SEO-016',
  ruleId: 'indexability-status',
  severity: 'critical',
  weight: 25,
  title: 'Page is indexable by search engines',
  impact: 'If a page is blocked from indexing, it cannot appear in search engine results regardless of other SEO factors.',
  recommendation: 'Ensure the page is not blocked by robots.txt, does not have a noindex meta tag, and has a valid self-referencing canonical tag.',
  evidenceType: 'meta-tag',
  additivePoints: 25,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);
    const details: string[] = [];

    // 1. Check robots meta
    const isNoIndex = isBlockedByRobotsMeta($ as any);
    if (isNoIndex) {
      details.push('Page is blocked by a "noindex" or "none" robots meta tag.');
    }

    // 2. Check canonical tag
    const canonicalHref = $('link[rel="canonical"]').first().attr('href');
    let hasValidCanonical = false;
    if (!canonicalHref || !canonicalHref.trim()) {
      details.push('Missing <link rel="canonical"> element.');
    } else {
      const canonicalKey = normalizeCanonicalKey(canonicalHref);
      if (!canonicalKey) {
        details.push(`Canonical href is not a valid absolute URL: ${canonicalHref}`);
      } else {
        const pageUrl = ctx.url || ctx.crawlData?.url || '';
        const pageKey = pageUrl ? normalizeCanonicalKey(pageUrl) : null;
        if (pageKey !== null && pageKey !== canonicalKey) {
          details.push(`Canonical points to ${canonicalHref} but the page URL is ${pageUrl}`);
        } else {
          hasValidCanonical = true;
        }
      }
    }

    // 3. Robots.txt evaluation
    const isRobotsTxtBlocked = (ctx.crawlData as any).robotsInfo?.blocked === true;
    if (isRobotsTxtBlocked) {
      details.push('Page is blocked by robots.txt.');
    }

    const isBlocked = isNoIndex || isRobotsTxtBlocked;
    
    // Set the seoHealth flag directly on the context if applicable
    if (isBlocked) {
      if (!ctx.seoHealth) {
        ctx.seoHealth = {};
      }
      ctx.seoHealth.indexability = 'BLOCKED';
    } else {
      if (!ctx.seoHealth) {
        ctx.seoHealth = {};
      }
      ctx.seoHealth.indexability = 'OK';
    }

    const passed = !isBlocked && hasValidCanonical;

    if (isBlocked) {
      return {
        passed: false,
        actual: 'Page is blocked from indexing',
        expected: 'Page should be indexable by search engines',
        summary: 'Page is blocked from indexing.',
        details: details.length > 0 ? details : undefined,
        points: 0,
      };
    }

    return {
      passed,
      actual: passed ? 'Page is indexable and has a valid canonical tag' : 'Page has indexability issues',
      expected: 'Page should be indexable by search engines',
      summary: passed ? 'Page is indexable.' : `Indexability issues: ${details.join(' ')}`,
      details: details.length > 0 ? details : undefined,
      points: passed ? 25 : 0,
    };
  },
};
