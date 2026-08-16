import { EngineContext } from '../shared/engine.types';
import { Severity, EvidenceType } from '../../models/audit-issue.interface';
import * as cheerio from 'cheerio';
import { IndexabilityRule } from './rules/indexability.rule';
import { OnPageTitleRule, OnPageMetaDescriptionRule, OnPageH1Rule } from './rules/on-page.rule';

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

import { ContentWordCountRule } from './rules/content.rule';
import { InternalLinkingRule } from './rules/linking.rule';

import { OpenGraphRule, TwitterCardRule, JsonLdRule } from './rules/structured-data.rule';
import { PageExperienceRule } from './rules/page-experience.rule';

export const SEO_RULES: SeoRule[] = [
  IndexabilityRule,
  OnPageTitleRule,
  OnPageMetaDescriptionRule,
  OnPageH1Rule,
  ContentWordCountRule,
  InternalLinkingRule,
  OpenGraphRule,
  TwitterCardRule,
  JsonLdRule,
  PageExperienceRule,
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
];

export function normalizeCanonicalKey(raw: string): string | null {
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

export function extractHostname(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
}
