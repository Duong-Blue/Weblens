import { EngineContext } from '../../shared/engine.types';
import { SeoCheckResult, SeoRule } from '../seo-rules';
import * as cheerio from 'cheerio';

export const OpenGraphRule: SeoRule = {
  id: 'SEO-021',
  ruleId: 'open-graph-complete',
  severity: 'medium',
  weight: 5,
  title: 'Document has complete Open Graph tags',
  impact: 'Complete Open Graph tags (og:title, og:description, og:image) enable rich previews when the page is shared on social platforms.',
  recommendation: 'Add og:title, og:description and og:image with non-empty content; og:image should be an absolute URL.',
  evidenceType: 'meta-tag',
  additivePoints: 5, // max 5 for OG
  evaluate: (ctx: EngineContext): SeoCheckResult => {
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
    
    // Store in context for frontend/AI
    if (ctx.seoDetails) {
        ctx.seoDetails.openGraph = { title: ogTitle, description: ogDescription, image: ogImage };
    }

    return {
      passed,
      actual: `og:title=${ogTitle ?? '(missing)'}; og:description=${ogDescription ?? '(missing)'}; og:image=${ogImage ?? '(missing)'}`,
      expected: 'og:title, og:description and og:image should be present and valid',
      summary: passed
        ? 'Open Graph tags are complete.'
        : `Open Graph issues: ${details.join('; ')}`,
      details: passed ? undefined : details,
      points: passed ? 5 : 0, // All or nothing for 5 points
    };
  },
};

export const TwitterCardRule: SeoRule = {
  id: 'SEO-022',
  ruleId: 'twitter-card-complete',
  severity: 'medium',
  weight: 5,
  title: 'Document has complete Twitter Card tags',
  impact: 'Complete Twitter Card tags (twitter:card, twitter:title, twitter:description) improve how the page appears when shared on X/Twitter.',
  recommendation: 'Add twitter:card, twitter:title and twitter:description with non-empty content.',
  evidenceType: 'meta-tag',
  additivePoints: 5,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
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
    
    if (ctx.seoDetails) {
        ctx.seoDetails.twitterCard = { card, title, description };
    }

    return {
      passed,
      actual: `twitter:card=${card ?? '(missing)'}; twitter:title=${title ?? '(missing)'}; twitter:description=${description ?? '(missing)'}`,
      expected: 'twitter:card, twitter:title and twitter:description should be present with non-empty content',
      summary: passed
        ? 'Twitter Card tags are complete.'
        : `Twitter Card issues: ${details.join('; ')}`,
      details: passed ? undefined : details,
      points: passed ? 5 : 0,
    };
  },
};

export const JsonLdRule: SeoRule = {
    id: 'SEO-023',
    ruleId: 'json-ld-present-valid',
    severity: 'low',
    weight: 5, // We cap structured data at 10 (OG+Twitter = 10, let's say JsonLD provides alternate structure points if needed, or adjust total elsewhere. Let's give it 5 for JSONLD, maybe we have 15 max structured data. Wait, instruction says: Structured Data (10%) bao gồm Json-LD và Open Graph / Twitter Cards. 5 cho Json-LD, 5 cho Social (OG/Tw)? Let's group Social as 5 and JsonLD as 5. Wait, OG=5, Tw=5 is 10. Let's make OG 5, Tw 0? Or Social 5, JsonLD 5. Let's make OG 2.5, Tw 2.5, JsonLD 5)
    title: 'Document has valid structured data (JSON-LD)',
    impact: 'Structured data helps search engines understand the content and enables rich snippets in search results.',
    recommendation: 'Add a valid <script type="application/ld+json"> block.',
    evidenceType: 'json-ld-block',
    additivePoints: 5,
    evaluate: (ctx: EngineContext): SeoCheckResult => {
      const html = ctx.crawlData?.htmlContent || '';
      const $ = cheerio.load(html);
      const scripts = $('script[type="application/ld+json"]').toArray();
      
      const details: string[] = [];
      let validCount = 0;
      const parsedBlocks: any[] = [];
  
      if (scripts.length === 0) {
        return {
          passed: false,
          actual: '0 JSON-LD blocks found',
          expected: 'At least 1 valid JSON-LD block',
          summary: 'No JSON-LD structured data found.',
          points: 0,
        };
      }
  
      for (const el of scripts) {
        const content = $(el).html() || '';
        if (!content.trim()) continue;
        
        try {
          const parsed = JSON.parse(content);
          parsedBlocks.push(parsed);
          validCount++;
        } catch (e) {
          details.push('Found a JSON-LD block but it contains invalid JSON syntax.');
        }
      }
      
      if (ctx.seoDetails) {
        ctx.seoDetails.jsonLd = parsedBlocks;
      }
  
      const passed = validCount > 0;
  
      return {
        passed,
        actual: `${scripts.length} block(s) found, ${validCount} valid`,
        expected: 'At least 1 valid JSON-LD block',
        summary: passed ? 'Valid JSON-LD structured data is present.' : 'JSON-LD is missing or invalid.',
        details: details.length > 0 ? details : undefined,
        points: passed ? 5 : 0,
      };
    },
  };
