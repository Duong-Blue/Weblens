import { Injectable } from '@nestjs/common';
import { EngineContext, EngineResult } from '../shared/engine.types';
import { IssueFactory } from '../shared/issue-factory.service';
import { SEO_RULES } from './seo-rules';
import { AuditIssue } from '../../models/audit-issue.interface';
import { SEO_REFERENCES } from './seo-references';
import { SeoCategory, SEO_CATEGORY_WEIGHTS } from './seo-scoring';

@Injectable()
export class SeoEngineService {
  analyze(ctx: EngineContext): EngineResult {
    const issues: AuditIssue[] = [];
    const categoryScores: Record<SeoCategory, { earned: number; possible: number }> = {
      [SeoCategory.INDEXABILITY]: { earned: 0, possible: 0 },
      [SeoCategory.ON_PAGE]: { earned: 0, possible: 0 },
      [SeoCategory.CONTENT]: { earned: 0, possible: 0 },
      [SeoCategory.LINKS]: { earned: 0, possible: 0 },
      [SeoCategory.STRUCTURED_DATA]: { earned: 0, possible: 0 },
      [SeoCategory.PAGE_EXPERIENCE]: { earned: 0, possible: 0 },
    };

    // Helper to map rule ID to category
    const getCategory = (ruleId: string): SeoCategory => {
      if (['robots-txt-present', 'sitemap-present', 'canonical-present', 'canonical-correct'].includes(ruleId)) return SeoCategory.INDEXABILITY;
      if (['title-present', 'meta-description-present', 'h1-present-single', 'heading-hierarchy'].includes(ruleId)) return SeoCategory.ON_PAGE;
      if (['open-graph-present', 'open-graph-complete', 'twitter-card-present', 'twitter-card-complete'].includes(ruleId)) return SeoCategory.CONTENT;
      if (['internal-external-link-ratio'].includes(ruleId)) return SeoCategory.LINKS;
      if (['json-ld-present'].includes(ruleId)) return SeoCategory.STRUCTURED_DATA;
      return SeoCategory.PAGE_EXPERIENCE;
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

    // Update: Calculate final weighted score
    let finalScore = 0;
    for (const cat of Object.values(SeoCategory)) {
      const { earned, possible } = categoryScores[cat];
      if (possible > 0) {
        const catScore = (earned / possible) * SEO_CATEGORY_WEIGHTS[cat];
        finalScore += catScore;
      } else {
        // If a category has no possible points, its weight is redistributed to others or ignored.
        // Assuming we normalize based on the sum of weights of categories that have at least one rule.
        // For now, let's keep it simple: if category is empty, we don't penalize it.
        // We'll normalize by the total weight of categories that have rules.
      }
    }
    
    // Normalize if not all categories are used
    const totalPossibleWeight = Object.values(SeoCategory).reduce((acc, cat) => {
       return categoryScores[cat].possible > 0 ? acc + SEO_CATEGORY_WEIGHTS[cat] : acc;
    }, 0);

    const normalizedScore = totalPossibleWeight > 0 ? (finalScore / totalPossibleWeight) * 100 : 100;

    return {
      score: Math.min(Math.max(Math.round(normalizedScore), 0), 100),
      issues,
    };
  }
}
