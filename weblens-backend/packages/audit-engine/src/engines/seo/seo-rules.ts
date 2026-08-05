import { EngineContext } from '../shared/engine.types';
import { Severity, EvidenceType } from '../../models/audit-issue.interface';
import * as cheerio from 'cheerio';

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
  passCondition: (ctx: EngineContext) => boolean;
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
  }
];
