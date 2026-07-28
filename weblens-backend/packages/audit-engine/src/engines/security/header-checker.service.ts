import { Injectable } from '@nestjs/common';
import { AuditIssue } from '../../models';

export interface HeaderCheck {
  headerName: string;
  expected: string | RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mozillaTestId: string;
  passCondition: (value: string | undefined) => boolean;
  recommendation: string;
}

export const SECURITY_HEADER_CHECKS: HeaderCheck[] = [
  {
    headerName: 'strict-transport-security',
    expected: /max-age=\d{5,}/i,
    severity: 'critical',
    mozillaTestId: 'hsts',
    passCondition: (v) => !!v && /max-age=\d+/i.test(v),
    recommendation: 'Add Strict-Transport-Security header with max-age ≥ 31536000 (1 year) and includeSubDomains.',
  },
  {
    headerName: 'content-security-policy',
    expected: /default-src\s+/i,
    severity: 'critical',
    mozillaTestId: 'csp',
    passCondition: (v) => !!v && v.length > 20,
    recommendation: 'Implement a Content-Security-Policy header with at least default-src directive. Avoid unsafe-inline unless necessary.',
  },
  {
    headerName: 'x-frame-options',
    expected: /^(DENY|SAMEORIGIN)$/i,
    severity: 'high',
    mozillaTestId: 'x-frame-options',
    passCondition: (v) => !!v && /^(DENY|SAMEORIGIN)$/i.test(v),
    recommendation: 'Add X-Frame-Options: DENY (or SAMEORIGIN if framing is needed) to prevent clickjacking.',
  },
  {
    headerName: 'x-content-type-options',
    expected: /^nosniff$/i,
    severity: 'high',
    mozillaTestId: 'x-content-type-options',
    passCondition: (v) => v?.toLowerCase() === 'nosniff',
    recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME-type sniffing.',
  },
  {
    headerName: 'referrer-policy',
    expected: /strict-origin-when-cross-origin|same-origin|no-referrer/i,
    severity: 'medium',
    mozillaTestId: 'referrer-policy',
    passCondition: (v) => !!v && /strict-origin-when-cross-origin|same-origin|no-referrer/i.test(v),
    recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin to control referrer information.',
  },
  {
    headerName: 'permissions-policy',
    expected: /camera|microphone|geolocation/i,
    severity: 'medium',
    mozillaTestId: 'permissions-policy',
    passCondition: (v) => !!v && v.length > 10,
    recommendation: 'Add Permissions-Policy header to restrict browser features (camera, microphone, geolocation, etc.).',
  },
  {
    headerName: 'cross-origin-opener-policy',
    expected: /same-origin|same-origin-allow-popups/i,
    severity: 'medium',
    mozillaTestId: 'cross-origin-opener-policy',
    passCondition: (v) => !!v && /same-origin/i.test(v),
    recommendation: 'Add Cross-Origin-Opener-Policy: same-origin to improve isolation between browsing contexts.',
  },
  {
    headerName: 'cross-origin-resource-policy',
    expected: /same-origin|same-site/i,
    severity: 'medium',
    mozillaTestId: 'cross-origin-resource-policy',
    passCondition: (v) => !!v && /same-origin|same-site/i.test(v),
    recommendation: 'Add Cross-Origin-Resource-Policy: same-origin to prevent data leaks.',
  },
  {
    headerName: 'server',
    expected: /./,  // Just exists
    severity: 'low',
    mozillaTestId: 'server-header',
    passCondition: (v) => v === undefined || v?.length === 0,  // Pass = không có hoặc ko lộ version
    recommendation: 'Remove or minimize Server header information — do not expose version details.',
  },
];

@Injectable()
export class HeaderCheckerService {
  checkSecurityHeaders(headers: Record<string, string>): AuditIssue[] {
    const issues: AuditIssue[] = [];

    for (const check of SECURITY_HEADER_CHECKS) {
      const value = headers[check.headerName] || headers[check.headerName.toLowerCase()];
      const pass = check.passCondition(value);

      issues.push({
        id: `SEC-${(SECURITY_HEADER_CHECKS.indexOf(check) + 1).toString().padStart(3, '0')}`,
        ruleId: check.headerName.replace(/-/g, '-').toLowerCase(),
        engine: 'security',
        severity: check.severity,
        status: pass ? 'pass' : 'fail',
        score: pass ? 1 : 0,
        weight: check.severity === 'critical' ? 10 : 
               check.severity === 'high' ? 7 :
               check.severity === 'medium' ? 4 : 2,
        title: pass 
          ? `${check.headerName} header is properly set`
          : `${check.headerName} header is missing or misconfigured`,
        description: pass
          ? `Value: ${value || '(not set — considered acceptable)'}`
          : `Expected: ${check.expected}. Current: ${value || '(missing)'}`,
        impact: `Missing ${check.headerName} exposes users to ${this.getHeaderRisk(check.headerName)} attacks.`,
        recommendation: check.recommendation,
        evidence: [{
          type: 'http-header',
          actual: value || '(missing)',
          expected: check.expected.toString(),
          source: 'response.headers()', confidence: 1.0,
        }],
        effort: 'minutes',
        category: 'security',
      });
    }

    return issues;
  }

  private getHeaderRisk(headerName: string): string {
    const risks: Record<string, string> = {
      'strict-transport-security': 'man-in-the-middle and downgrade',
      'content-security-policy': 'cross-site scripting (XSS) and data injection',
      'x-frame-options': 'clickjacking',
      'x-content-type-options': 'MIME-type sniffing',
      'referrer-policy': 'information leakage',
      'permissions-policy': 'unauthorized browser feature access',
      'cross-origin-opener-policy': 'cross-origin information leaks',
      'cross-origin-resource-policy': 'cross-origin data leaks',
      'server': 'information disclosure',
    };
    return risks[headerName] || 'security';
  }
}
