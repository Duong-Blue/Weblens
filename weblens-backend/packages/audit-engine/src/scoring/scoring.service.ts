import { EngineScore, OverallResult } from './scoring.interface';
import { AuditIssue, EngineType } from '../models';

export class ScoringService {
  private static readonly ENGINE_WEIGHTS: Partial<Record<EngineType, number>> = {
    seo: 0.20,
    performance: 0.20,
    accessibility: 0.15,
    security: 0.15,
    'best-practices': 0.10,
    content: 0.10,
    html: 0.05,
    css: 0.05
  };

  private static readonly SEVERITY_WEIGHTS = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 2
  };

  static calculateEngineScore(engine: EngineType, issues: AuditIssue[]): EngineScore {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const issueCount = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: issues.length,
      passed: 0,
      failed: 0
    };

    issues.forEach(issue => {
      // Assuming issue.weight and issue.score are properly mapped from issue.severity and status
      // If issue.weight is not provided, fallback to severity weight
      const weight = issue.weight || this.SEVERITY_WEIGHTS[issue.severity] || 0;
      totalWeightedScore += (issue.score * weight);
      totalWeight += weight;

      if (issue.status === 'pass') {
        issueCount.passed++;
      } else if (issue.status === 'fail' || issue.status === 'warning') {
        issueCount.failed++;
        if (issue.severity === 'critical') issueCount.critical++;
        else if (issue.severity === 'high') issueCount.high++;
        else if (issue.severity === 'medium') issueCount.medium++;
        else if (issue.severity === 'low') issueCount.low++;
      }
    });

    const score = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 100; // default 100 if no issues
    const weight = this.ENGINE_WEIGHTS[engine] || 0;

    return {
      engine,
      score: Math.round(score),
      weight,
      weightedScore: score * weight,
      issues,
      issueCount
    };
  }

  static calculateOverallScore(engineScores: EngineScore[]): OverallResult {
    let totalWeighted = 0;
    let totalWeight = 0;
    const breakdown: Record<string, number> = {};
    
    for (const es of engineScores) {
      totalWeighted += es.weightedScore;
      totalWeight += es.weight;
      breakdown[es.engine] = es.score;
    }
    
    const overallScore = totalWeight > 0 
      ? Math.round(totalWeighted / totalWeight)
      : 0;
      
    return {
      overallScore,
      breakdown,
      label: this.getScoreLabel(overallScore),
      color: this.getScoreColor(overallScore),
      totalIssues: engineScores.reduce((a, e) => a + e.issueCount.total, 0),
      criticalIssues: engineScores.reduce((a, e) => a + e.issueCount.critical, 0),
      highIssues: engineScores.reduce((a, e) => a + e.issueCount.high, 0),
    };
  }

  private static getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 65) return 'Satisfactory';
    if (score >= 50) return 'Needs Work';
    if (score >= 35) return 'Poor';
    return 'Critical';
  }

  private static getScoreColor(score: number): string {
    if (score >= 80) return '🟢'; // Excellent & Good
    if (score >= 65) return '🟡'; // Satisfactory
    if (score >= 50) return '🟠'; // Needs Work
    if (score >= 35) return '🔴'; // Poor
    return '⚫'; // Critical
  }
}
