import { AuditIssue } from '../types/audit.types';
export interface TLSInfo {
    version: string;
    cipherSuite: string;
    certificate: {
        issuer: {
            commonName: string;
        };
        validFrom: string;
        validTo: string;
        daysRemaining: number;
    };
}
export declare class TlsValidatorService {
    checkTLS(tlsInfo: TLSInfo | null | undefined): AuditIssue[];
}
