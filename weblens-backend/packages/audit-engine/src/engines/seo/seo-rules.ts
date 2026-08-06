import { EngineContext } from '../shared/engine.types';
import { Severity, EvidenceType } from '../../models/audit-issue.interface';
import * as cheerio from 'cheerio';

export interface SeoCheckResult {
  passed: boolean;
  actual: string;
  expected: string;
  summary?: string;
  details?: string[];
  /** Additive points to award when passed. Defaults to rule.additivePoints. */
  points?: number;
  recommendation?: string;
}

export interface SeoRule {
  id: string;
  ruleId: string;
  severity: Severity;
  weight: number;
  title: string;
  impact: string;
  recommendation?: string;
  evidenceType: EvidenceType;
  additivePoints: number;
  /** Simple boolean rule (backwards compatible with the original engine). */
  passCondition?: (ctx: EngineContext) => boolean;
  /** Richer, evidence-producing rule used when present. */
  evaluate?: (ctx: EngineContext) => SeoCheckResult;
}

export const SEO_RULES: SeoRule[] = [
  {
    id: 'SEO-001',
    ruleId: 'title-present',
    severity: 'critical',
    weight: 10,
    title: 'Document has a <title> element',
    impact: 'The title element gives users and search engines a concise overview of the page content.',
    recommendation: 'Add a <title> element to the <head> of the document.',
    evidenceType: 'meta-tag',
    additivePoints: 25,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      return $('title').text().trim().length > 0;
    },
  },
  {
    id: 'SEO-002',
    ruleId: 'meta-description-present',
    severity: 'high',
    weight: 10,
    title: 'Document has a meta description',
    impact: 'Meta descriptions may be included in search results to concisely summarize page content.',
    recommendation: 'Add a <meta name="description" content="..."> element to the document <head>.',
    evidenceType: 'meta-tag',
    additivePoints: 25,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      return $('meta[name="description"]').length > 0;
    },
  },
  {
    id: 'SEO-003',
    ruleId: 'h1-present-single',
    severity: 'high',
    weight: 10,
    title: 'Document has exactly one <h1> element',
    impact: 'A single <h1> element helps search engines understand the main topic of the page.',
    recommendation: 'Ensure there is exactly one <h1> element on the page.',
    evidenceType: 'html-element',
    additivePoints: 10,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      return $('h1').length === 1;
    },
  },
  {
    id: 'SEO-004',
    ruleId: 'open-graph-present',
    severity: 'medium',
    weight: 5,
    title: 'Document has Open Graph meta tags',
    impact: 'Open Graph tags improve how links are displayed when shared on social media.',
    recommendation: 'Add og:title, og:description, and og:image meta tags to the document <head>.',
    evidenceType: 'meta-tag',
    additivePoints: 15,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const hasTitle = $('meta[property="og:title"]').length > 0;
      const hasDescription = $('meta[property="og:description"]').length > 0;
      const hasImage = $('meta[property="og:image"]').length > 0;
      return hasTitle && hasDescription && hasImage;
    },
  },
  {
    id: 'SEO-005',
    ruleId: 'twitter-card-present',
    severity: 'medium',
    weight: 5,
    title: 'Document has Twitter Card meta tags',
    impact: 'Twitter Card tags improve how links are displayed when shared on Twitter.',
    recommendation: 'Add twitter:card, twitter:title, and twitter:description meta tags to the document <head>.',
    evidenceType: 'meta-tag',
    additivePoints: 10,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const hasCard = $('meta[name="twitter:card"]').length > 0;
      const hasTitle = $('meta[name="twitter:title"]').length > 0;
      const hasDescription = $('meta[name="twitter:description"]').length > 0;
      return hasCard && hasTitle && hasDescription;
    },
  },
  {
    id: 'SEO-006',
    ruleId: 'json-ld-present',
    severity: 'low',
    weight: 5,
    title: 'Document has structured data (JSON-LD)',
    impact: 'Structured data helps search engines understand the content and enables rich snippets in search results.',
    recommendation: 'Add a <script type="application/ld+json"> block with appropriate structured data.',
    evidenceType: 'json-ld-block',
    additivePoints: 15,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      return $('script[type="application/ld+json"]').length > 0;
    },
  },
  {
    id: 'SEO-007',
    ruleId: 'robots-txt-present',
    severity: 'medium',
    weight: 5,
    title: 'Site has a valid robots.txt',
    impact: 'A robots.txt file guides search engine crawlers on which pages to index.',
    recommendation: 'Ensure a valid robots.txt is present at the root of the domain.',
    evidenceType: 'file-content',
    additivePoints: 0,
    passCondition: (ctx) => {
      return !!(ctx.crawlData as any).robotsInfo?.found;
    },
  },
  {
    id: 'SEO-008',
    ruleId: 'sitemap-present',
    severity: 'medium',
    weight: 5,
    title: 'Site has a valid sitemap.xml',
    impact: 'A sitemap helps search engines discover all pages on your site.',
    recommendation: 'Ensure a valid sitemap.xml is present and referenced in robots.txt.',
    evidenceType: 'file-content',
    additivePoints: 0,
    passCondition: (ctx) => {
      return !!(ctx.crawlData as any).sitemapInfo?.found;
    },
  },
  {
    id: 'SEO-009',
    ruleId: 'canonical-present',
    severity: 'medium',
    weight: 5,
    title: 'Document has a valid canonical link',
    impact: 'Canonical links help prevent duplicate content issues in search engines.',
    recommendation: 'Add a <link rel="canonical" href="..."> to the document <head>.',
    evidenceType: 'html-element',
    additivePoints: 0,
    passCondition: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      return $('link[rel="canonical"]').length > 0;
    },
  },
  {
    id: 'SEO-010',
    ruleId: 'heading-hierarchy',
    severity: 'high',
    weight: 10,
    title: 'Headings follow a logical, sequential hierarchy',
    impact: 'A logical heading structure (H1 -> H2 -> H3) helps search engines and assistive technologies understand how the page is organized.',
    recommendation: 'Use a single <h1> and do not skip heading levels (e.g. going from <h2> directly to <h4>).',
    evidenceType: 'html-element',
    additivePoints: 10,
    evaluate: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const headingEls = $('h1, h2, h3, h4, h5, h6').toArray();
      const levels = headingEls.map((el) =>
        parseInt(String($(el).prop('tagName')).slice(1), 10)
      );

      if (levels.length === 0) {
        return {
          passed: false,
          actual: 'No heading elements (h1-h6) were found',
          expected: 'The document should contain headings starting with a single <h1>',
          summary: 'The document has no heading structure.',
          points: 0,
        };
      }

      const details: string[] = [];
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          details.push(
            `Heading level skips from <h${levels[i - 1]}> to <h${levels[i]}>.`
          );
        }
      }
      const passed = details.length === 0;
      return {
        passed,
        actual: `Headings found: ${headingEls
          .map((el) => String($(el).prop('tagName')).toLowerCase())
          .join(', ')}`,
        expected: 'Sequential heading order with no skipped levels (H1 -> H2 -> H3)',
        summary: passed
          ? 'Heading hierarchy is sequential with no skipped levels.'
          : `${details.length} heading level skip(s) detected.`,
        details: passed ? undefined : details,
        points: passed ? 10 : 0,
      };
    },
  },
  {
    id: 'SEO-011',
    ruleId: 'canonical-correct',
    severity: 'high',
    weight: 10,
    title: 'Canonical link is valid and consistent with the page URL',
    impact: 'A correct self-referencing canonical link prevents duplicate content issues and consolidates ranking signals.',
    recommendation: 'Ensure a single <link rel="canonical" href="..."> points to the canonical version of the current page.',
    evidenceType: 'html-element',
    additivePoints: 10,
    evaluate: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const canonicalHref = $('link[rel="canonical"]').first().attr('href');

      if (!canonicalHref || !canonicalHref.trim()) {
        return {
          passed: false,
          actual: 'No <link rel="canonical"> element found',
          expected: 'A canonical link should be present in the document <head>',
          summary: 'Missing canonical tag.',
        };
      }

      const canonicalKey = normalizeCanonicalKey(canonicalHref);
      if (!canonicalKey) {
        return {
          passed: false,
          actual: `Canonical href is not a valid absolute URL: ${canonicalHref}`,
          expected: 'The canonical href should be an absolute http(s) URL',
          summary: 'Invalid canonical URL.',
          recommendation: `Use an absolute URL, e.g. ${ctx.url || 'https://example.com/page'}`,
        };
      }

      const pageUrl = ctx.url || ctx.crawlData?.url || '';
      const pageKey = pageUrl ? normalizeCanonicalKey(pageUrl) : null;

      if (pageKey !== null && pageKey !== canonicalKey) {
        return {
          passed: false,
          actual: `Canonical points to ${canonicalHref} but the page URL is ${pageUrl}`,
          expected: `Canonical should resolve to ${pageUrl}`,
          summary: 'Canonical URL does not match the current page URL.',
          recommendation: `Set the canonical href to ${pageUrl}`,
        };
      }

      return {
        passed: true,
        actual: `Canonical: ${canonicalHref}`,
        expected: 'Canonical should be absolute and consistent with the page URL',
        summary: 'Canonical link is valid and consistent with the page URL.',
      };
    },
  },
  {
    id: 'SEO-012',
    ruleId: 'open-graph-complete',
    severity: 'medium',
    weight: 5,
    title: 'Open Graph tags contain complete, non-empty values',
    impact: 'Complete Open Graph tags (og:title, og:description, og:image) enable rich, controlled previews when the page is shared on social platforms.',
    recommendation: 'Add og:title, og:description and og:image with non-empty content; og:image should be an absolute URL.',
    evidenceType: 'meta-tag',
    additivePoints: 5,
    evaluate: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const readOg = (prop: string) =>
        $('meta[property="og:' + prop + '"]').first().attr('content')?.trim();

      const ogTitle = readOg('title');
      const ogDescription = readOg('description');
      const ogImage = readOg('image');

      const details: string[] = [];
      if (!ogTitle) details.push('og:title is missing or empty');
      if (!ogDescription) details.push('og:description is missing or empty');
      if (!ogImage) details.push('og:image is missing or empty');
      else if (!/^https?:\/\//i.test(ogImage))
        details.push(`og:image is not an absolute URL: ${ogImage}`);

      const passed = details.length === 0;
      return {
        passed,
        actual: `og:title=${ogTitle ?? '(missing)'}; og:description=${ogDescription ?? '(missing)'}; og:image=${ogImage ?? '(missing)'}`,
        expected:
          'og:title, og:description and og:image should be present with non-empty content',
        summary: passed
          ? 'Open Graph tags are complete.'
          : `Open Graph issues: ${details.join('; ')}`,
        details: passed ? undefined : details,
      };
    },
  },
  {
    id: 'SEO-013',
    ruleId: 'twitter-card-complete',
    severity: 'medium',
    weight: 5,
    title: 'Twitter Card tags contain complete, non-empty values',
    impact: 'Complete Twitter Card tags (twitter:card, twitter:title, twitter:description) improve how the page appears when shared on X/Twitter.',
    recommendation: 'Add twitter:card, twitter:title and twitter:description with non-empty content.',
    evidenceType: 'meta-tag',
    additivePoints: 5,
    evaluate: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const readTw = (name: string) =>
        $('meta[name="twitter:' + name + '"]').first().attr('content')?.trim();

      const card = readTw('card');
      const title = readTw('title');
      const description = readTw('description');

      const details: string[] = [];
      if (!card) details.push('twitter:card is missing or empty');
      if (!title) details.push('twitter:title is missing or empty');
      if (!description) details.push('twitter:description is missing or empty');

      const passed = details.length === 0;
      return {
        passed,
        actual: `twitter:card=${card ?? '(missing)'}; twitter:title=${title ?? '(missing)'}; twitter:description=${description ?? '(missing)'}`,
        expected:
          'twitter:card, twitter:title and twitter:description should be present with non-empty content',
        summary: passed
          ? 'Twitter Card tags are complete.'
          : `Twitter Card issues: ${details.join('; ')}`,
        details: passed ? undefined : details,
      };
    },
  },
  {
    id: 'SEO-014',
    ruleId: 'image-alt-attributes',
    severity: 'high',
    weight: 10,
    title: 'All images have alt text',
    impact: 'Alt text is essential for accessibility and helps search engines understand image content and context.',
    recommendation: 'Add descriptive alt attributes to every <img>; use alt="" for purely decorative images.',
    evidenceType: 'html-attribute',
    additivePoints: 10,
    evaluate: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const images = $('img').toArray();

      if (images.length === 0) {
        return {
          passed: true,
          actual: 'No images found on the page',
          expected: 'Every image should have an alt attribute',
          summary: 'No images to evaluate.',
          points: 0,
        };
      }

      const missingAlt = images.filter((el) => $(el).attr('alt') === undefined);
      const details = missingAlt
        .slice(0, 10)
        .map((el) => $(el).attr('src') || $(el).attr('data-src') || '<no src>');

      const passed = missingAlt.length === 0;
      return {
        passed,
        actual: `${missingAlt.length} of ${images.length} image(s) missing alt text`,
        expected:
          'Every image should have an alt attribute (empty alt allowed for decorative images)',
        summary: passed
          ? `All ${images.length} image(s) have alt text.`
          : `${missingAlt.length} image(s) are missing alt text.`,
        details: passed ? undefined : details,
        points: passed ? 10 : 0,
      };
    },
  },
  {
    id: 'SEO-015',
    ruleId: 'internal-external-link-ratio',
    severity: 'low',
    weight: 5,
    title: 'Page maintains a healthy internal vs external link ratio',
    impact: 'Internal links distribute authority and improve crawling; pages dominated by external links dilute their SEO value.',
    recommendation: 'Keep the majority of links internal and use rel="nofollow" where appropriate for external links.',
    evidenceType: 'html-element',
    additivePoints: 5,
    evaluate: (ctx) => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
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
      const passed = internalRatio >= 0.3;
      return {
        passed,
        actual: `${internal} internal, ${external} external link(s) (${Math.round(
          internalRatio * 100
        )}% internal)`,
        expected: 'At least 30% of links should point to internal pages',
        summary: passed
          ? 'Internal/external link balance is healthy.'
          : 'External links dominate the page; consider adding more internal links.',
        points: passed ? 5 : 0,
      };
    },
  },
];

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

function extractHostname(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
}
