import { Injectable } from '@nestjs/common';
import { EngineContext, EngineResult } from '../shared/engine.types';
import { IssueFactory } from '../shared/issue-factory.service';
import { SEO_RULES } from './seo-rules';
import { AuditIssue } from '../../models/audit-issue.interface';
import { SEO_REFERENCES } from './seo-references';

@Injectable()
export class SeoEngineService {
  analyze(ctx: EngineContext): EngineResult {
    const issues: AuditIssue[] = [];
    let score = 0;

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

      if (evaluation.passed) {
        score += evaluation.points ?? rule.additivePoints;
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

    return {
      score: Math.min(Math.max(score, 0), 100),
      issues,
    };
  }
}
