import { AuditIssue } from '../types/audit.types';
export interface MozillaResult {
    score: number;
    grade: string;
    bonuses: number;
}
export interface SecurityScoreResult {
    score: number;
    mozillaResult: MozillaResult;
}
export declare class SecurityMapperService {
    calculateMozillaScore(issues: AuditIssue[]): MozillaResult;
    getMozillaGrade(score: number): string;
    calculateSecurityScore(issues: AuditIssue[]): SecurityScoreResult;
    private calculateWeightedScore;
}
