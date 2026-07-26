import { AuditIssue } from '../types/audit.types';
export interface HeaderCheck {
    headerName: string;
    expected: string | RegExp;
    severity: 'critical' | 'high' | 'medium' | 'low';
    mozillaTestId: string;
    passCondition: (value: string | undefined) => boolean;
    recommendation: string;
}
export declare const SECURITY_HEADER_CHECKS: HeaderCheck[];
export declare class HeaderCheckerService {
    checkSecurityHeaders(headers: Record<string, string>): AuditIssue[];
    private getHeaderRisk;
}
