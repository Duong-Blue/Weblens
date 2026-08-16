import { Injectable } from '@nestjs/common';
import { EngineContext, EngineResult } from '../shared/engine.types';
import { IssueFactory } from '../shared/issue-factory.service';
import { SEO_RULES } from './seo-rules';
import { AuditIssue } from '../../models/audit-issue.interface';
import { SEO_REFERENCES } from './seo-references';
import { SeoCategory, SEO_CATEGORY_WEIGHTS } from './seo-scoring';
import * as cheerio from 'cheerio';
import { SeoDetails } from '@weblens/shared-types/src/entities/audit-result.entity';

@Injectable()
export class SeoEngineService {
  analyze(ctx: EngineContext): EngineResult & { seoDetails: SeoDetails } {
    const issues: AuditIssue[] = [];
    const categoryScores: Record<SeoCategory, { earned: number; possible: number }> = {
      [SeoCategory.INDEXABILITY]: { earned: 0, possible: 0 },
      [SeoCategory.ON_PAGE]: { earned: 0, possible: 0 },
      [SeoCategory.CONTENT]: { earned: 0, possible: 0 },
      [SeoCategory.LINKS]: { earned: 0, possible: 0 },
      [SeoCategory.STRUCTURED_DATA]: { earned: 0, possible: 0 },
      [SeoCategory.PAGE_EXPERIENCE]: { earned: 0, possible: 0 },
    };

    const getCategory = (ruleId: string): SeoCategory => {
      if (['indexability-status', 'robots-txt-present', 'sitemap-present', 'canonical-present', 'canonical-correct'].includes(ruleId)) return SeoCategory.INDEXABILITY;
      if (['title-optimization', 'meta-description-optimization', 'h1-optimization', 'title-present', 'meta-description-present', 'h1-present-single', 'heading-hierarchy', 'image-alt-attributes'].includes(ruleId)) return SeoCategory.ON_PAGE;
      if (['content-word-count'].includes(ruleId)) return SeoCategory.CONTENT;
      if (['internal-external-link-ratio'].includes(ruleId)) return SeoCategory.LINKS;
      if (['json-ld-present-valid', 'open-graph-complete', 'twitter-card-complete'].includes(ruleId)) return SeoCategory.STRUCTURED_DATA;
      if (['core-web-vitals'].includes(ruleId)) return SeoCategory.PAGE_EXPERIENCE;
      
      return SeoCategory.ON_PAGE;
    };

    for (const rule of SEO_RULES) {
      const evaluation = rule.evaluate
        ? rule.evaluate(ctx)
        : rule.passCondition
          ? {
              passed: rule.passCondition(ctx),
              actual: 'Condition met',
              expected: 'Condition should be met',
            }
          : {
              passed: false,
              actual: 'Rule could not be evaluated',
              expected: 'Rule should evaluate successfully',
              summary: 'This rule has no evaluation implementation.',
            };

      const category = getCategory(rule.ruleId);
      const points = evaluation.points ?? rule.additivePoints;
      
      if (points > 0) {
        categoryScores[category].possible += points;
        if (evaluation.passed) {
          categoryScores[category].earned += points;
        }
      }

      const issue = IssueFactory.bool(
        evaluation.passed,
        'seo',
        rule.ruleId,
        rule.title,
        rule.impact,
        rule.severity,
        rule.weight,
        'SEO',
        rule.impact,
        evaluation.actual,
        evaluation.expected,
        rule.evidenceType,
        'seo-engine',
        evaluation.recommendation ?? rule.recommendation
      );

      const evidence = issue.evidence[0];
      if (evidence) {
        if (evaluation.summary) {
          evidence.textContent = evaluation.summary;
        }
        if (evaluation.details && evaluation.details.length > 0) {
          evidence.details = evaluation.details;
          evidence.actual = `${evidence.actual} (${evaluation.details.join(
            '; '
          )})`;
        }
      }

      const ref = SEO_REFERENCES[rule.ruleId];
      if (ref) {
        const refText = `${ref.title}: ${ref.url}`;
        issue.recommendation = issue.recommendation
          ? `${issue.recommendation} See ${refText}.`
          : `See ${refText}.`;
      }

      issues.push(issue);
    }
    
    if (ctx.seoHealth?.indexability === 'BLOCKED') {
      categoryScores[SeoCategory.INDEXABILITY].earned = 0;
    }

    let finalScore = 0;
    for (const cat of Object.values(SeoCategory)) {
      const { earned, possible } = categoryScores[cat];
      if (possible > 0) {
        const catScore = (earned / possible) * SEO_CATEGORY_WEIGHTS[cat];
        finalScore += catScore;
      }
    }
    
    const totalPossibleWeight = Object.values(SeoCategory).reduce((acc, cat) => {
       return categoryScores[cat].possible > 0 ? acc + SEO_CATEGORY_WEIGHTS[cat] : acc;
    }, 0);

    const normalizedScore = totalPossibleWeight > 0 ? (finalScore / totalPossibleWeight) * 100 : 100;

    const html = ctx.crawlData?.htmlContent || '';
    const $ = cheerio.load(html);

    const titleText = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content')?.trim();
    
    const readOg = (prop: string) => $('meta[property="og:' + prop + '"]').first().attr('content')?.trim();
    const readTw = (name: string) => $('meta[name="twitter:' + name + '"]').first().attr('content')?.trim();

    const h1Count = $('h1').length;

    const seoDetails: SeoDetails = {
      title: titleText || undefined,
      hasTitle: !!titleText,
      description: metaDesc || undefined,
      hasMetaDescription: !!metaDesc,
      hasH1: h1Count > 0,
      h1Count,
      linksCount: $('a[href]').length,
      openGraph: {
        title: readOg('title'),
        description: readOg('description'),
        image: readOg('image'),
      },
      twitter: {
        card: readTw('card'),
        title: readTw('title'),
        description: readTw('description'),
      },
      hasJsonLd: $('script[type="application/ld+json"]').length > 0,
      robotsTxtExists: !!(ctx.crawlData as any).robotsInfo?.found,
      sitemapExists: !!(ctx.crawlData as any).sitemapInfo?.found,
      canonicalExists: $('link[rel="canonical"]').length > 0,
    };

    return {
      score: Math.min(Math.max(Math.round(normalizedScore), 0), 100),
      issues,
      seoDetails,
    };
  }
}
