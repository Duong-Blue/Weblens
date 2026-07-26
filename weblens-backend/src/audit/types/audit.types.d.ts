export interface AuditIssue {
    id: string;
    ruleId: string;
    engine: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'pass' | 'fail' | 'warning' | 'not-applicable';
    score: number;
    weight: number;
    title: string;
    description: string;
    impact?: string;
    recommendation?: string;
    evidence?: {
        type: string;
        actual: string;
        expected?: string;
        source?: string;
    }[];
    effort?: string;
    category: string;
}
