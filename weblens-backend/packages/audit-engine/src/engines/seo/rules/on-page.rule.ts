import { EngineContext } from '../../shared/engine.types';
import { SeoCheckResult, SeoRule } from '../seo-rules';
import * as cheerio from 'cheerio';

export const OnPageTitleRule: SeoRule = {
  id: 'SEO-017',
  ruleId: 'title-optimization',
  severity: 'high',
  weight: 15,
  title: 'Title tag is present and has optimal length',
  impact: 'An optimized title tag helps search engines and users understand the page content. Titles that are too short may lack context, while titles that are too long will be truncated in search results.',
  recommendation: 'Provide a descriptive <title> element between 10 and 60 characters long.',
  evidenceType: 'meta-tag',
  additivePoints: 15,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);
    const titleText = $('title').text().trim();
    const details: string[] = [];

    if (!titleText) {
      return {
        passed: false,
        actual: 'No <title> element found or title is empty',
        expected: 'Page should have a <title> element between 10 and 60 characters',
        summary: 'Missing or empty title tag.',
        points: 0,
      };
    }

    let passed = true;
    let points = 15;

    if (titleText.length < 10) {
      passed = false;
      points = 5;
      details.push(`Title is too short (${titleText.length} characters). Recommended minimum is 10.`);
    } else if (titleText.length > 60) {
      passed = false;
      points = 10;
      details.push(`Title is too long (${titleText.length} characters). It may be truncated. Recommended maximum is 60.`);
    }

    return {
      passed,
      actual: `Title: "${titleText}" (${titleText.length} characters)`,
      expected: 'Title length between 10 and 60 characters',
      summary: passed ? 'Title tag is optimized.' : 'Title tag is present but length is not optimal.',
      details: details.length > 0 ? details : undefined,
      points,
    };
  },
};

export const OnPageMetaDescriptionRule: SeoRule = {
  id: 'SEO-018',
  ruleId: 'meta-description-optimization',
  severity: 'high',
  weight: 15,
  title: 'Meta description is present and has optimal length',
  impact: 'Meta descriptions provide a summary for search snippets. Optimal length improves click-through rates.',
  recommendation: 'Provide a <meta name="description"> between 50 and 160 characters long.',
  evidenceType: 'meta-tag',
  additivePoints: 15,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);
    const description = $('meta[name="description"]').attr('content')?.trim();
    const details: string[] = [];

    if (!description) {
      return {
        passed: false,
        actual: 'No meta description found or it is empty',
        expected: 'Page should have a meta description between 50 and 160 characters',
        summary: 'Missing or empty meta description.',
        points: 0,
      };
    }

    let passed = true;
    let points = 15;

    if (description.length < 50) {
      passed = false;
      points = 5;
      details.push(`Description is too short (${description.length} characters). Recommended minimum is 50.`);
    } else if (description.length > 160) {
      passed = false;
      points = 10;
      details.push(`Description is too long (${description.length} characters). It may be truncated. Recommended maximum is 160.`);
    }

    return {
      passed,
      actual: `Description length: ${description.length} characters`,
      expected: 'Description length between 50 and 160 characters',
      summary: passed ? 'Meta description is optimized.' : 'Meta description is present but length is not optimal.',
      details: details.length > 0 ? details : undefined,
      points,
    };
  },
};

export const OnPageH1Rule: SeoRule = {
  id: 'SEO-019',
  ruleId: 'h1-optimization',
  severity: 'high',
  weight: 10,
  title: 'Page has exactly one non-empty H1 tag',
  impact: 'A single, descriptive H1 tag helps search engines understand the primary topic of the page.',
  recommendation: 'Ensure there is exactly one non-empty <h1> element on the page.',
  evidenceType: 'html-element',
  additivePoints: 10,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);
    const h1Els = $('h1');
    const h1Count = h1Els.length;
    
    if (h1Count === 0) {
      return {
        passed: false,
        actual: '0 <h1> elements found',
        expected: 'Exactly one non-empty <h1> element',
        summary: 'Missing H1 tag.',
        points: 0,
      };
    }

    if (h1Count > 1) {
      return {
        passed: false,
        actual: `${h1Count} <h1> elements found`,
        expected: 'Exactly one non-empty <h1> element',
        summary: 'Multiple H1 tags found. Use only one.',
        points: 0, // Could give partial points, but strictly 0
      };
    }

    const h1Text = h1Els.first().text().trim();
    if (!h1Text) {
      return {
        passed: false,
        actual: '1 <h1> element found, but it is empty',
        expected: 'Exactly one non-empty <h1> element',
        summary: 'H1 tag is empty.',
        points: 0,
      };
    }

    return {
      passed: true,
      actual: `1 <h1> element found: "${h1Text.substring(0, 50)}${h1Text.length > 50 ? '...' : ''}"`,
      expected: 'Exactly one non-empty <h1> element',
      summary: 'Page has exactly one non-empty H1 tag.',
      points: 10,
    };
  },
};