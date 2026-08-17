import { AuditIssue } from '../models/audit-issue.interface';
import { PerformanceContext } from './performance-context.interface';
import { IssueFactory } from '../engines/shared/issue-factory.service';

export interface PerformanceMappingResult {
  issues: AuditIssue[];
  opportunities: AuditIssue[];
}

export class PerformanceIssueMapper {
  static map(context: PerformanceContext): PerformanceMappingResult {
    const issues: AuditIssue[] = [];
    const opportunities: AuditIssue[] = [];

    const { webVitals: metrics, navigation, network, resources } = context;

    const tbt = metrics.tbt ?? metrics.totalBlockingTime;

    // LCP
    if (metrics.lcp !== undefined) {
      if (metrics.lcp > 4000) {
        issues.push(this.createDeterministicIssue('PERF-LCP-01', 'LCP High', `LCP is ${metrics.lcp}ms`, 'high', 'fail', 1, 'performance', 'metrics.lcp', 'metrics.lcp', 0));
      } else if (metrics.lcp > 2500) {
        issues.push(this.createDeterministicIssue('PERF-LCP-02', 'LCP Warning', `LCP is ${metrics.lcp}ms`, 'medium', 'warning', 1, 'performance', 'metrics.lcp', 'metrics.lcp', 50));
      } else {
        issues.push(this.createDeterministicIssue('PERF-LCP-00', 'LCP Good', `LCP is ${metrics.lcp}ms`, 'low', 'pass', 0.1, 'performance', 'metrics.lcp', 'metrics.lcp', 100));
      }
    }

    // CLS
    if (metrics.cls !== undefined) {
      if (metrics.cls > 0.25) {
        issues.push(this.createDeterministicIssue('PERF-CLS-01', 'CLS High', `CLS is ${metrics.cls}`, 'high', 'fail', 1, 'performance', 'metrics.cls', 'metrics.cls', 0));
      } else if (metrics.cls > 0.1) {
        issues.push(this.createDeterministicIssue('PERF-CLS-02', 'CLS Warning', `CLS is ${metrics.cls}`, 'medium', 'warning', 1, 'performance', 'metrics.cls', 'metrics.cls', 50));
      } else {
        issues.push(this.createDeterministicIssue('PERF-CLS-00', 'CLS Good', `CLS is ${metrics.cls}`, 'low', 'pass', 0.1, 'performance', 'metrics.cls', 'metrics.cls', 100));
      }
    }

    // INP
    if (metrics.inp !== undefined) {
      if (metrics.inp > 500) {
        issues.push(this.createDeterministicIssue('PERF-INP-01', 'INP High', `INP is ${metrics.inp}ms`, 'high', 'fail', 1, 'performance', 'metrics.inp', 'metrics.inp', 0));
      } else if (metrics.inp > 200) {
        issues.push(this.createDeterministicIssue('PERF-INP-02', 'INP Warning', `INP is ${metrics.inp}ms`, 'medium', 'warning', 1, 'performance', 'metrics.inp', 'metrics.inp', 50));
      } else {
        issues.push(this.createDeterministicIssue('PERF-INP-00', 'INP Good', `INP is ${metrics.inp}ms`, 'low', 'pass', 0.1, 'performance', 'metrics.inp', 'metrics.inp', 100));
      }
    }

    // FCP
    if (metrics.fcp !== undefined) {
      if (metrics.fcp > 3000) {
        issues.push(this.createDeterministicIssue('PERF-FCP-01', 'FCP High', `FCP is ${metrics.fcp}ms`, 'high', 'fail', 1, 'performance', 'metrics.fcp', 'metrics.fcp', 0));
      } else if (metrics.fcp > 1800) {
        issues.push(this.createDeterministicIssue('PERF-FCP-02', 'FCP Warning', `FCP is ${metrics.fcp}ms`, 'medium', 'warning', 1, 'performance', 'metrics.fcp', 'metrics.fcp', 50));
      } else {
        issues.push(this.createDeterministicIssue('PERF-FCP-00', 'FCP Good', `FCP is ${metrics.fcp}ms`, 'low', 'pass', 0.1, 'performance', 'metrics.fcp', 'metrics.fcp', 100));
      }
    }

    // TTFB
    if (metrics.ttfb !== undefined) {
      if (metrics.ttfb > 1500) {
        issues.push(this.createDeterministicIssue('PERF-TTFB-01', 'TTFB High', `TTFB is ${metrics.ttfb}ms`, 'high', 'fail', 1, 'performance', 'metrics.ttfb', 'metrics.ttfb', 0));
      } else if (metrics.ttfb > 800) {
        issues.push(this.createDeterministicIssue('PERF-TTFB-02', 'TTFB Warning', `TTFB is ${metrics.ttfb}ms`, 'medium', 'warning', 1, 'performance', 'metrics.ttfb', 'metrics.ttfb', 50));
      } else {
        issues.push(this.createDeterministicIssue('PERF-TTFB-00', 'TTFB Good', `TTFB is ${metrics.ttfb}ms`, 'low', 'pass', 0.1, 'performance', 'metrics.ttfb', 'metrics.ttfb', 100));
      }
    }

    // Diagnostics (Load)
    if (navigation.loadTimeMs !== undefined) {
      if (navigation.loadTimeMs > 6000) {
        issues.push(this.createDeterministicIssue('PERF-LOAD-01', 'Very Slow Load', 'Load > 6s', 'high', 'fail', 1, 'performance', 'diagnostics.load', 'diagnostics.load', 0));
      } else if (navigation.loadTimeMs > 3000) {
        issues.push(this.createDeterministicIssue('PERF-LOAD-02', 'Slow Load', 'Load > 3s', 'medium', 'warning', 1, 'performance', 'diagnostics.load', 'diagnostics.load', 50));
      }
    }

    // Diagnostics (Network)
    if (network.requestsTotal !== undefined) {
      if (network.requestsTotal > 100) {
        issues.push(this.createDeterministicIssue('PERF-NET-01', 'Too many requests', 'Reqs > 100', 'medium', 'warning', 1, 'performance', 'diagnostics.reqs', 'diagnostics.reqs', 50));
      }
    }

    // Render blocking
    if (resources && resources.length > 0) {
      const rb = resources.some(r => r.initiatorType === 'script' || r.initiatorType === 'css'); // Approximate render blocking for now
      if (rb) {
        issues.push(this.createDeterministicIssue('PERF-BLOCK-01', 'Render Blocking Resources', 'Found RB resources', 'medium', 'warning', 1, 'performance', 'diagnostics.rb', 'diagnostics.rb', 50));
      }
    }

    // TBT
    if (tbt !== undefined) {
      if (tbt > 600) {
        issues.push(this.createDeterministicIssue('PERF-TBT-01', 'High TBT', `TBT is ${tbt}ms`, 'low', 'warning', 0.5, 'performance', 'diagnostics.tbt', 'diagnostics.tbt', 50));
      } else {
        issues.push(this.createDeterministicIssue('PERF-TBT-00', 'Good TBT', `TBT is ${tbt}ms`, 'low', 'pass', 0.1, 'performance', 'diagnostics.tbt', 'diagnostics.tbt', 100));
      }
    }
    
    // Opportunities
    if (resources && resources.length > 0) {
      const jsSize = resources.filter(r => r.initiatorType === 'script').reduce((acc, curr) => acc + (curr.transferSize || 0), 0);
      if (jsSize > 350 * 1024) {
        opportunities.push(this.createDeterministicIssue('PERF-RES-JS', 'Heavy JS Payload', 'JS > 350KB', 'low', 'warning', 0.5, 'performance', 'diagnostics.js', 'diagnostics.js', 50, 'Reduce JS payload'));
      }
    }

    return { issues, opportunities };
  }

  private static createDeterministicIssue(
    ruleId: string, title: string, description: string, severity: any, status: any, weight: number, category: string, actual: string, expected: string, score: number, recommendation?: string
  ): AuditIssue {
    const issue = IssueFactory.create('performance', ruleId, title, description, severity, status, weight, category, 'impact', [{ type: 'performance-metric', actual, expected, source: 'audit', confidence: 1 }], recommendation, score);
    issue.id = ruleId; // Override for deterministic ID
    return issue;
  }
}
