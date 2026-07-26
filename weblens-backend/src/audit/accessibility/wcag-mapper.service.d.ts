import * as axe from 'axe-core';
export interface AuditIssue {
    id: string;
    ruleId: string;
    engine: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    status: 'pass' | 'fail' | 'warning' | 'manual-review';
    score: number;
    weight: number;
    title: string;
    description: string;
    impact?: string;
    recommendation: string;
    evidence: Array<{
        type: string;
        selector?: string;
        actual: string;
        expected: string;
        htmlSnippet?: string;
        source: string;
    }>;
    effort: string;
    category: string;
    wcagRef?: string;
}
export interface CrawlResult {
    htmlContent: string;
}
export interface LinkAnalysis {
    descriptiveTexts: string[];
    genericTexts: string[];
}
export interface FormInfo {
}
export interface AccScoreResult {
    accScore: number;
    levelA: number;
    levelAA: number;
    totalIssues: number;
    passCount: number;
    failCount: number;
    manualCount: number;
}
export declare class WcagMapperService {
    private readonly logger;
    private readonly AXE_WEIGHT_MAP;
    mapAxeToIssues(axeResults: axe.AxeResults): AuditIssue[];
    private mapAxeImpact;
    private mapAxeWeight;
    calculateAccScore(issues: AuditIssue[]): AccScoreResult;
    checkFocusNotObscured(crawlData: CrawlResult): AuditIssue;
    checkTargetSize(links: LinkAnalysis, forms?: FormInfo): AuditIssue;
}
