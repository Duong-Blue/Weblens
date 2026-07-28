import { Injectable } from '@nestjs/common';
import { AuditIssue } from '../../models';

export interface MozillaResult {
  score: number;
  grade: string;
  bonuses: number;
}

export interface SecurityScoreResult {
  score: number;
  mozillaResult: MozillaResult;
}

@Injectable()
export class SecurityMapperService {
  calculateMozillaScore(issues: AuditIssue[]): MozillaResult {
    let score = 100;  // Baseline
    
    // Penalties (luôn áp dụng)
    for (const issue of issues) {
      if (issue.status === 'fail') {
        switch (issue.ruleId) {
          case 'https-enabled': score -= 50; break;
          case 'hsts-enabled': score -= 20; break;
          case 'csp-enabled': score -= 20; break;
          case 'x-frame-options': score -= 10; break;
          case 'x-content-type-options': score -= 10; break;
          case 'referrer-policy': score -= 5; break;
          case 'permissions-policy': score -= 5; break;
          default: break;
        }
      }
    }
    
    score = Math.max(0, score);
    
    // Bonuses (chỉ khi score >= 90)
    let bonuses = 0;
    if (score >= 90) {
      const passed = new Set(issues.filter(i => i.status === 'pass').map(i => i.ruleId));
      if (passed.has('hsts-enabled') && passed.has('hsts-max-age')) bonuses += 10;
      if (passed.has('csp-enabled') && passed.has('csp-strict-dynamic')) bonuses += 10;
      if (passed.has('hsts-preload-ready')) bonuses += 5;
      if (passed.has('csp-report-uri')) bonuses += 5;
      score += bonuses;
    }
    
    // Grade
    const grade = this.getMozillaGrade(score);
    
    return { score: Math.min(score, 145), grade, bonuses };
  }

  getMozillaGrade(score: number): string {
    if (score >= 100) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 30) return 'D';
    if (score >= 25) return 'D-';
    return 'F';
  }

  calculateSecurityScore(issues: AuditIssue[]): SecurityScoreResult {
    // Security: scoring khác các engine khác
    // Vì 1 lỗi critical (no HTTPS) có thể làm mất tác dụng các lỗi khác
    
    const hasFatalError = issues.some(i => 
      i.ruleId === 'https-enabled' && i.status === 'fail'
    );
    
    let score = this.calculateWeightedScore(issues);
    
    if (hasFatalError) {
      // HTTPS fail -> tối đa 40 điểm
      score = Math.min(40, score);
    }
    
    const mozillaResult = this.calculateMozillaScore(issues);
    
    return {
      score,
      mozillaResult
    };
  }

  private calculateWeightedScore(issues: AuditIssue[]): number {
    const weightMap: Record<string, number> = {
      'critical': 10, 'high': 7, 'medium': 4, 'low': 2,
    };
    
    if (issues.length === 0) return 100;

    let totalWeight = 0;
    let earnedWeight = 0;
    
    for (const issue of issues) {
      const w = weightMap[issue.severity] || 4;
      totalWeight += w;
      earnedWeight += w * issue.score;
    }
    
    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
  }
}