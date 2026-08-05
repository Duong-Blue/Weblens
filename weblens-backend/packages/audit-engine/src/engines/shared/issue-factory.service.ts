import { AuditIssue, EngineType, Evidence, EvidenceType, IssueStatus, Severity } from '../../models/audit-issue.interface';

export class IssueFactory {
  static create(
    engine: EngineType,
    ruleId: string,
    title: string,
    description: string,
    severity: Severity,
    status: IssueStatus,
    weight: number,
    category: string,
    impact: string,
    evidence: Evidence[],
    recommendation?: string
  ): AuditIssue {
    return {
      id: `${engine.toUpperCase()}-${ruleId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ruleId,
      engine,
      title,
      description,
      severity,
      status,
      score: status === 'pass' ? 100 : 0,
      weight,
      category,
      impact,
      evidence,
      recommendation,
    };
  }

  static bool(
    condition: boolean,
    engine: EngineType,
    ruleId: string,
    title: string,
    description: string,
    severity: Severity,
    weight: number,
    category: string,
    impact: string,
    actual: string,
    expected: string,
    evidenceType: EvidenceType,
    source: string,
    recommendation?: string
  ): AuditIssue {
    const status: IssueStatus = condition ? 'pass' : 'fail';
    return this.create(
      engine,
      ruleId,
      title,
      description,
      severity,
      status,
      weight,
      category,
      impact,
      [
        {
          type: evidenceType,
          actual,
          expected,
          source,
          confidence: 1,
        },
      ],
      recommendation
    );
  }
}
