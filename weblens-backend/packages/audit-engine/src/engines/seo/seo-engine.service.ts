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
      const passed = rule.passCondition(ctx);
      
      if (passed) {
        score += rule.additivePoints;
      }

      const issue = IssueFactory.bool(
        passed,
        'seo',
        rule.ruleId,
        rule.title,
        rule.impact,
        rule.severity,
        rule.weight,
        'SEO',
        rule.impact,
        passed ? 'Condition met' : 'Condition failed',
        'Condition should be met',
        rule.evidenceType,
        'seo-engine',
        rule.recommendation
      );

      // Map reference if available
      const ref = SEO_REFERENCES[rule.ruleId];
      if (ref && !issue.recommendation) {
         issue.recommendation = `See ${ref} for more information.`;
      } else if (ref && issue.recommendation) {
         issue.recommendation = `${issue.recommendation} See ${ref} for more information.`;
      }

      issues.push(issue);
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      issues,
    };
  }
}
