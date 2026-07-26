"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WcagMapperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WcagMapperService = void 0;
const common_1 = require("@nestjs/common");
let WcagMapperService = WcagMapperService_1 = class WcagMapperService {
    logger = new common_1.Logger(WcagMapperService_1.name);
    AXE_WEIGHT_MAP = {
        critical: 10,
        serious: 7,
        moderate: 4,
        minor: 2,
    };
    mapAxeToIssues(axeResults) {
        const issues = [];
        for (const violation of axeResults.violations) {
            for (const node of violation.nodes) {
                issues.push({
                    id: `ACC-AXE-${violation.id}`,
                    ruleId: violation.id,
                    engine: 'accessibility',
                    severity: this.mapAxeImpact(violation.impact),
                    status: 'fail',
                    score: 0,
                    weight: this.mapAxeWeight(violation.impact),
                    title: violation.help,
                    description: violation.description,
                    impact: `This issue affects users with ${violation.tags.filter(t => t.startsWith('wcag')).join(', ') || 'disabilities'}.`,
                    recommendation: node.failureSummary || violation.helpUrl,
                    evidence: [{
                            type: 'html-element',
                            selector: node.target.join(' '),
                            actual: node.html || '',
                            expected: node.failureSummary || 'Follow WCAG guidelines',
                            htmlSnippet: node.html,
                            source: 'axe-core',
                        }],
                    effort: 'hours',
                    category: 'accessibility',
                    wcagRef: violation.tags.find(t => /^wcag\d/.test(t)),
                });
            }
        }
        return issues;
    }
    mapAxeImpact(impact) {
        switch (impact) {
            case 'critical':
                return 'critical';
            case 'serious':
                return 'high';
            case 'moderate':
                return 'medium';
            case 'minor':
                return 'low';
            default:
                return 'medium';
        }
    }
    mapAxeWeight(impact) {
        if (!impact)
            return 4;
        return this.AXE_WEIGHT_MAP[impact] || 4;
    }
    calculateAccScore(issues) {
        let totalWeight = 0;
        let earnedWeight = 0;
        const counts = {
            levelA: { pass: 0, fail: 0, total: 0 },
            levelAA: { pass: 0, fail: 0, total: 0 }
        };
        for (const issue of issues) {
            if (issue.status === 'manual-review')
                continue;
            const w = issue.weight;
            totalWeight += w;
            earnedWeight += w * issue.score;
            const isLevelA = issue.wcagRef && (issue.wcagRef.includes('wcag2a') || issue.wcagRef.includes('wcag21a'));
            if (isLevelA || (issue.id.startsWith('ACC-') && parseInt(issue.id.split('-')[1]) <= 30)) {
                counts.levelA.total++;
                if (issue.status === 'pass')
                    counts.levelA.pass++;
                else
                    counts.levelA.fail++;
            }
            else {
                counts.levelAA.total++;
                if (issue.status === 'pass')
                    counts.levelAA.pass++;
                else
                    counts.levelAA.fail++;
            }
        }
        const accScore = totalWeight > 0
            ? Math.round((earnedWeight / totalWeight) * 100)
            : 100;
        return {
            accScore,
            levelA: counts.levelA.total > 0
                ? Math.round((counts.levelA.pass / counts.levelA.total) * 100)
                : 100,
            levelAA: counts.levelAA.total > 0
                ? Math.round((counts.levelAA.pass / counts.levelAA.total) * 100)
                : 100,
            totalIssues: issues.length,
            passCount: issues.filter(i => i.status === 'pass').length,
            failCount: issues.filter(i => i.status === 'fail').length,
            manualCount: issues.filter(i => i.status === 'manual-review').length,
        };
    }
    checkFocusNotObscured(crawlData) {
        const html = crawlData.htmlContent;
        const hasStickyHeader = /position\s*:\s*(fixed|sticky)\s*;\s*top\s*:\s*0/i.test(html);
        const hasCookieBanner = /(cookie|consent|gdpr)\s*banner/i.test(html);
        const hasStickyFooter = /position\s*:\s*(fixed|sticky)\s*;\s*bottom\s*:\s*0/i.test(html);
        const passes = !hasStickyHeader && !hasCookieBanner;
        return {
            id: 'ACC-043',
            ruleId: 'focus-not-obscured-min',
            engine: 'accessibility',
            severity: 'high',
            status: passes ? 'pass' : 'warning',
            score: passes ? 1 : 0.5,
            weight: 7,
            title: passes
                ? 'Focus is not obscured by fixed/sticky elements'
                : 'Focus may be obscured by fixed/sticky elements',
            description: passes
                ? 'No fixed/sticky elements found that could cover focused elements.'
                : 'Found fixed/sticky elements that may cover focused elements when tabbing through the page. Common with sticky headers and cookie consent banners.',
            impact: 'Users navigating by keyboard may not see which element is focused, causing confusion and navigation issues.',
            recommendation: 'Ensure sticky headers/footers have a z-index that allows focused elements to be visible, or add scroll-margin-top to main content.',
            evidence: [{
                    type: 'css-rule',
                    actual: hasStickyHeader ? 'position: fixed/sticky on header' : (hasCookieBanner ? 'Found cookie banner' : 'No sticky header'),
                    expected: 'No element should obscure focused elements during keyboard navigation',
                    source: 'CSS analysis',
                }],
            effort: 'hours',
            category: 'accessibility',
            wcagRef: 'WCAG 2.2 SC 2.4.11',
        };
    }
    checkTargetSize(links, forms) {
        const smallTargets = [];
        for (const link of links.descriptiveTexts.concat(links.genericTexts || [])) {
            if (link && link.length < 4)
                smallTargets.push(link);
        }
        const passes = smallTargets.length === 0;
        return {
            id: 'ACC-045',
            ruleId: 'target-size-min',
            engine: 'accessibility',
            severity: 'medium',
            status: passes ? 'pass' : 'fail',
            score: passes ? 1 : Math.max(0, 1 - (smallTargets.length * 0.1)),
            weight: 4,
            title: passes
                ? 'Click targets meet minimum size (24×24px)'
                : `Found ${smallTargets.length} potentially undersized click targets`,
            description: passes
                ? 'All interactive elements appear to meet the minimum target size requirement.'
                : 'Some click targets may be smaller than 24x24 CSS pixels, making them hard to tap on mobile devices for users with motor disabilities.',
            impact: 'Small touch targets cause frustration for users with motor impairments and on mobile devices.',
            recommendation: 'Ensure all interactive elements (links, buttons, form controls) are at least 24x24 CSS pixels. Add padding to small links.',
            evidence: [{
                    type: 'html-element',
                    actual: `Found ${smallTargets.length} potentially undersized targets`,
                    expected: 'All interactive targets >= 24x24 CSS pixels',
                    source: 'DOM analysis (heuristic)',
                }],
            effort: 'hours',
            category: 'accessibility',
            wcagRef: 'WCAG 2.2 SC 2.5.8',
        };
    }
};
exports.WcagMapperService = WcagMapperService;
exports.WcagMapperService = WcagMapperService = WcagMapperService_1 = __decorate([
    (0, common_1.Injectable)()
], WcagMapperService);
//# sourceMappingURL=wcag-mapper.service.js.map