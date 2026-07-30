import { Injectable, Optional } from '@nestjs/common';
import { CrawlResult } from '../interfaces/crawl-result.interface';
import { PerfEngineResult } from './perf-result.interface';
import { PerfEngineConfig, DEFAULT_PERF_CONFIG } from './perf-config';
import { AuditIssue } from '../models/audit-issue.interface';
import { evaluateCWV, CWV_THRESHOLDS } from './cwv-thresholds';

@Injectable()
export class PerfEngineService {
  private readonly config: PerfEngineConfig;
  
  constructor(@Optional() config?: PerfEngineConfig) {
    this.config = config || DEFAULT_PERF_CONFIG;
  }

  analyze(crawlData: CrawlResult): PerfEngineResult {
    const { performanceTiming, cwv, networkRequests } = crawlData;
    let perfScore = 100;
    const issues: AuditIssue[] = [];

    // --- Performance Score from Load Time ---
    const loadTime =
      (performanceTiming.loadEventEnd || 0) - (performanceTiming.navigationStart || 0);

    if (loadTime > 6000) {
      perfScore -= 40;
      issues.push(this.createIssue('PERF-LOAD-01', 'critical', 'Page Load Time is Very Slow', `Load time is ${loadTime}ms.`, 'Page takes over 6s to load, significantly impacting user experience.', 'Load Event'));
    } else if (loadTime > 4000) {
      perfScore -= 25;
      issues.push(this.createIssue('PERF-LOAD-02', 'high', 'Page Load Time is Slow', `Load time is ${loadTime}ms.`, 'Page takes over 4s to load, leading to higher bounce rates.', 'Load Event'));
    } else if (loadTime > 2000) {
      perfScore -= 10;
      issues.push(this.createIssue('PERF-LOAD-03', 'medium', 'Page Load Time Needs Improvement', `Load time is ${loadTime}ms.`, 'Page takes over 2s to load.', 'Load Event'));
    }

    // --- Core Web Vitals ---
    if (cwv) {
      const lcpEval = evaluateCWV('lcp', cwv.lcp);
      if (lcpEval === 'fail') {
        perfScore -= 20;
        issues.push(this.createIssue('PERF-LCP-01', 'high', 'LCP is Poor', `LCP is ${cwv.lcp}ms (Threshold: >${CWV_THRESHOLDS['lcp'].poor}ms)`, 'Largest Contentful Paint takes too long, delaying the main content visibility.', 'LCP'));
      } else if (lcpEval === 'warning') {
        perfScore -= 10;
        issues.push(this.createIssue('PERF-LCP-02', 'medium', 'LCP Needs Improvement', `LCP is ${cwv.lcp}ms`, 'Largest Contentful Paint is slower than recommended.', 'LCP'));
      }

      const clsEval = evaluateCWV('cls', cwv.cls);
      if (clsEval === 'fail') {
        perfScore -= 20;
        issues.push(this.createIssue('PERF-CLS-01', 'high', 'CLS is Poor', `CLS is ${cwv.cls} (Threshold: >${CWV_THRESHOLDS['cls'].poor})`, 'High Cumulative Layout Shift causes visual instability and frustrates users.', 'CLS'));
      } else if (clsEval === 'warning') {
        perfScore -= 10;
        issues.push(this.createIssue('PERF-CLS-02', 'medium', 'CLS Needs Improvement', `CLS is ${cwv.cls}`, 'Cumulative Layout Shift is higher than recommended.', 'CLS'));
      }
      
      const inpEval = evaluateCWV('inp', cwv.inp);
      if (inpEval === 'fail') {
        perfScore -= 20;
        issues.push(this.createIssue('PERF-INP-01', 'high', 'INP is Poor', `INP is ${cwv.inp}ms (Threshold: >${CWV_THRESHOLDS['inp'].poor}ms)`, 'Interaction to Next Paint is slow, making the page feel unresponsive.', 'INP'));
      } else if (inpEval === 'warning') {
        perfScore -= 10;
        issues.push(this.createIssue('PERF-INP-02', 'medium', 'INP Needs Improvement', `INP is ${cwv.inp}ms`, 'Interaction to Next Paint is slower than recommended.', 'INP'));
      }
    }

    // --- Network penalties ---
    if (networkRequests) {
      const totalRequests = networkRequests.length;
      if (totalRequests > 100) {
        perfScore -= 20;
        issues.push(this.createIssue('PERF-NET-01', 'high', 'Too Many Network Requests', `Total Requests: ${totalRequests}`, 'Over 100 network requests can overwhelm the browser and delay rendering.', 'Network'));
      } else if (totalRequests > 50) {
        perfScore -= 10;
        issues.push(this.createIssue('PERF-NET-02', 'medium', 'High Number of Network Requests', `Total Requests: ${totalRequests}`, 'Over 50 network requests can increase page load time.', 'Network'));
      }

      const failedRequests = networkRequests.filter((r) => r.status >= 400).length;
      if (failedRequests > 0) {
        const penalty = Math.min(failedRequests * 2, 10);
        perfScore -= penalty;
        issues.push(this.createIssue('PERF-NET-ERR', 'high', 'Failed Network Requests', `${failedRequests} requests failed.`, 'Failed requests block rendering and cause errors.', 'Network'));
      }

      // Count render-blocking-like resources (scripts, stylesheets)
      const renderBlockingCount = networkRequests.filter(
        (r) => r.resourceType === 'script' || r.resourceType === 'stylesheet',
      ).length;
      if (renderBlockingCount > 20) {
        perfScore -= 10;
        issues.push(this.createIssue('PERF-BLOCK-01', 'medium', 'Excessive Render-Blocking Resources', `${renderBlockingCount} render-blocking resources.`, 'Too many scripts and stylesheets block initial rendering.', 'Network'));
      } else if (renderBlockingCount > 10) {
        perfScore -= 5;
        issues.push(this.createIssue('PERF-BLOCK-02', 'low', 'Many Render-Blocking Resources', `${renderBlockingCount} render-blocking resources.`, 'Consider deferring non-critical scripts and styles.', 'Network'));
      }
    }

    perfScore = Math.max(0, Math.min(100, Math.round(perfScore)));

    return {
      perfScore,
      issues,
      metrics: { lcp: cwv?.lcp, inp: cwv?.inp, cls: cwv?.cls },
      budgets: { pass: [], warning: [], fail: [], score: 100 },
      opportunities: []
    };
  }

  private createIssue(id: string, severity: 'critical' | 'high' | 'medium' | 'low', title: string, description: string, impact: string, source: string): AuditIssue {
    return {
      id,
      ruleId: id,
      engine: 'performance',
      severity,
      status: 'fail',
      score: 0,
      weight: 1,
      title,
      description,
      impact,
      category: 'performance',
      evidence: [{
        type: 'performance-metric',
        actual: description,
        expected: '',
        source,
        confidence: 1
      }]
    };
  }
}
