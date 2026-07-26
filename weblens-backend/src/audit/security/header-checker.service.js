"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderCheckerService = exports.SECURITY_HEADER_CHECKS = void 0;
const common_1 = require("@nestjs/common");
exports.SECURITY_HEADER_CHECKS = [
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
        expected: /./,
        severity: 'low',
        mozillaTestId: 'server-header',
        passCondition: (v) => v === undefined || v?.length === 0,
        recommendation: 'Remove or minimize Server header information — do not expose version details.',
    },
];
let HeaderCheckerService = class HeaderCheckerService {
    checkSecurityHeaders(headers) {
        const issues = [];
        for (const check of exports.SECURITY_HEADER_CHECKS) {
            const value = headers[check.headerName] || headers[check.headerName.toLowerCase()];
            const pass = check.passCondition(value);
            issues.push({
                id: `SEC-${(exports.SECURITY_HEADER_CHECKS.indexOf(check) + 1).toString().padStart(3, '0')}`,
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
                        source: 'response.headers()',
                    }],
                effort: 'minutes',
                category: 'security',
            });
        }
        return issues;
    }
    getHeaderRisk(headerName) {
        const risks = {
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
};
exports.HeaderCheckerService = HeaderCheckerService;
exports.HeaderCheckerService = HeaderCheckerService = __decorate([
    (0, common_1.Injectable)()
], HeaderCheckerService);
//# sourceMappingURL=header-checker.service.js.map