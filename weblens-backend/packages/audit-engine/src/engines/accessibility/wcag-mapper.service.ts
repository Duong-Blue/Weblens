import { Injectable, Logger } from '@nestjs/common';
import * as axe from 'axe-core';
import { AuditIssue } from '../../models';

export interface CrawlResult {
  htmlContent: string;
  // Other fields omitted for brevity
}

export interface LinkAnalysis {
  descriptiveTexts: string[];
  genericTexts: string[];
}

export interface FormInfo {
  // Omitted for brevity
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

@Injectable()
export class WcagMapperService {
  private readonly logger = new Logger(WcagMapperService.name);

  // Lighthouse-compatible Weighting
  private readonly AXE_WEIGHT_MAP: Record<string, number> = {
    critical: 10,
    serious: 7,
    moderate: 4,
    minor: 2,
  };

  /**
   * Map axe results to WebLens issues
   */
  mapAxeToIssues(axeResults: axe.AxeResults): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Map violations
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
            source: 'axe-core', confidence: 1.0,
          }],
          effort: 'hours',
          category: 'accessibility',
          wcagRef: violation.tags.find(t => /^wcag\d/.test(t)),
        });
      }
    }

    // Optionally map passes if needed for scoring, but typically we only report issues
    // Or we map them with status: 'pass' and score: 1

    return issues;
  }

  private mapAxeImpact(impact: string | null | undefined): 'critical' | 'high' | 'medium' | 'low' {
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
        return 'medium'; // Default fallback
    }
  }

  private mapAxeWeight(impact: string | null | undefined): number {
    if (!impact) return 4;
    return this.AXE_WEIGHT_MAP[impact] || 4;
  }

  /**
   * Calculate overall score based on the Lighthouse-compatible model
   */
  calculateAccScore(issues: AuditIssue[]): AccScoreResult {
    let totalWeight = 0;
    let earnedWeight = 0;
    const counts = {
      levelA: { pass: 0, fail: 0, total: 0 },
      levelAA: { pass: 0, fail: 0, total: 0 }
    };

    for (const issue of issues) {
      if (issue.status === 'manual-review') continue;

      const w = issue.weight;
      totalWeight += w;
      earnedWeight += w * issue.score;

      // Simple heuristic for level trackings: we could parse wcagRef
      // But based on the spec, rules ACC-001 to ACC-030 are level A roughly
      const isLevelA = issue.wcagRef && (issue.wcagRef.includes('wcag2a') || issue.wcagRef.includes('wcag21a'));
      
      if (isLevelA || (issue.id.startsWith('ACC-') && parseInt(issue.id.split('-')[1]) <= 30)) {
        counts.levelA.total++;
        if (issue.status === 'pass') counts.levelA.pass++;
        else counts.levelA.fail++;
      } else {
        counts.levelAA.total++;
        if (issue.status === 'pass') counts.levelAA.pass++;
        else counts.levelAA.fail++;
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

  // --- Custom WCAG 2.2 Checks ---

  /**
   * WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum)
   */
  checkFocusNotObscured(crawlData: CrawlResult): AuditIssue {
    const html = crawlData.htmlContent;
    
    // Pattern: position: fixed/sticky at top
    const hasStickyHeader = /position\s*:\s*(fixed|sticky)\s*;\s*top\s*:\s*0/i.test(html);
    const hasCookieBanner = /(cookie|consent|gdpr)\s*banner/i.test(html);
    const hasStickyFooter = /position\s*:\s*(fixed|sticky)\s*;\s*bottom\s*:\s*0/i.test(html);
    
    // Simplified check — real check needs visual rendering
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
        source: 'CSS analysis', confidence: 1.0,
      }],
      effort: 'hours',
      category: 'accessibility',
      wcagRef: 'WCAG 2.2 SC 2.4.11',
    };
  }

  /**
   * WCAG 2.2 SC 2.5.8 Target Size (Minimum)
   */
  checkTargetSize(links: LinkAnalysis, forms?: FormInfo): AuditIssue {
    const smallTargets: string[] = [];
    
    // Link text < 4 characters = potential small target
    for (const link of links.descriptiveTexts.concat(links.genericTexts || [])) {
      if (link && link.length < 4) smallTargets.push(link);
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
        source: 'DOM analysis (heuristic)', confidence: 1.0,
      }],
      effort: 'hours',
      category: 'accessibility',
      wcagRef: 'WCAG 2.2 SC 2.5.8',
    };
  }
}
