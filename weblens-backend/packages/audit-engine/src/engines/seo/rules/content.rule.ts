import { EngineContext } from '../../shared/engine.types';
import { SeoCheckResult, SeoRule } from '../seo-rules';
import * as cheerio from 'cheerio';

export const ContentWordCountRule: SeoRule = {
  id: 'SEO-020',
  ruleId: 'content-word-count',
  severity: 'high',
  weight: 20,
  title: 'Content has sufficient word count',
  impact: 'Thin content may be considered low quality by search engines. A sufficient word count helps establish topical authority.',
  recommendation: 'Ensure the main content contains at least 300 words.',
  evidenceType: 'html-element',
  additivePoints: 20,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);
    
    // Simple heuristic: remove scripts, styles, etc., and count words in body
    $('script, style, noscript, iframe').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text ? text.split(' ').length : 0;

    const details: string[] = [];
    let passed = true;
    let points = 20;

    if (wordCount < 300) {
      passed = false;
      points = Math.floor((wordCount / 300) * 20); // Partial score
      details.push(`Word count (${wordCount}) is below the recommended minimum of 300 words.`);
    }

    return {
      passed,
      actual: `${wordCount} words found`,
      expected: 'At least 300 words of content',
      summary: passed ? 'Word count is sufficient.' : 'Content may be considered thin.',
      details: details.length > 0 ? details : undefined,
      points,
    };
  },
};
