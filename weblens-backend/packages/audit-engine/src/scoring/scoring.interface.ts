import { AuditIssue } from '../models';

export interface EngineScore {
  engine: string;
  score: number;
  weight: number;
  weightedScore: number;
  issues: AuditIssue[];
  issueCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
    passed: number;
    failed: number;
  };
}

export interface OverallResult {
  overallScore: number;
  breakdown: Record<string, number>;
  label: string;
  color: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
}
