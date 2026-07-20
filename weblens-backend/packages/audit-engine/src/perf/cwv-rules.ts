import { CrawlResult } from '../interfaces/crawl-result.interface';
import { evaluateCWV, CWV_THRESHOLDS } from './cwv-thresholds';

export function checkCoreWebVital(metric: string, value: number | undefined, label: string): any {
  const status = evaluateCWV(metric, value);
  const threshold = CWV_THRESHOLDS[metric];
  
  const metricIndex = Object.keys(CWV_THRESHOLDS).indexOf(metric) + 1;
  const ruleId = `PERF-00${metricIndex}`;
  
  return {
    id: ruleId,
    ruleId: `${metric}-optimal`,
    engine: 'performance',
    severity: status === 'fail' ? 'critical' : (status === 'warning' ? 'high' : 'medium'),
    status: status === 'no-data' ? 'warning' : status,
    score: status === 'pass' ? 1 : (status === 'warning' ? 0.5 : 0),
    weight: status === 'fail' ? 10 : 7,
    title: `${label.toUpperCase()} is ${status === 'pass' ? 'optimal' : status === 'warning' ? 'needs improvement' : status === 'no-data' ? 'not measurable' : 'poor'}`,
    description: `${label} = ${value !== undefined ? value + threshold.unit : 'N/A'}. ` +
      `Threshold: good < ${threshold.good}${threshold.unit}, poor > ${threshold.poor}${threshold.unit}.`,
    impact: `${label} is a Google Core Web Vital and direct ranking signal. ` +
      `${status === 'fail' ? 'Poor values significantly impact search rankings and user experience.' : ''}`,
    recommendation: getCWVRecommendation(metric, status),
    evidence: [{
      type: 'performance-metric',
      actual: `${value !== undefined ? value + threshold.unit : 'N/A'}`,
      expected: `< ${threshold.good}${threshold.unit}`,
      source: 'PerformanceObserver',
    }],
    effort: status === 'fail' ? 'days' : (status === 'warning' ? 'hours' : 'minutes'),
    category: 'performance',
  };
}

export function getCWVRecommendation(metric: string, status: string): string {
  const recs: Record<string, Record<string, string>> = {
    lcp: {
      fail: 'Largest Contentful Paint is too slow. Optimize: (1) Server response time (TTFB), (2) Resource load priority — preload LCP image/font, (3) Remove render-blocking resources, (4) Use a CDN, (5) Optimize images to WebP/AVIF.',
      warning: 'LCP is borderline. Focus on: preloading the LCP image, optimizing server response, and removing render-blocking resources.',
      pass: 'LCP is good — maintain with regular performance monitoring.',
    },
    inp: {
      fail: 'Interaction to Next Paint is too high. Optimize: (1) Break up long tasks (>50ms), (2) Reduce main thread work, (3) Defer non-critical JavaScript, (4) Use web workers for heavy processing.',
      warning: 'INP needs improvement. Reduce JavaScript execution time and break up long tasks.',
      pass: 'INP is good — keep JavaScript bundles lean and avoid long tasks.',
    },
    cls: {
      fail: 'Cumulative Layout Shift is too high. Fix: (1) Set explicit width/height on images and embeds, (2) Reserve space for ads and dynamic content, (3) Use font-display: swap, (4) Avoid inserting content above existing content.',
      warning: 'CLS is borderline. Add explicit dimensions to all images and iframes.',
      pass: 'CLS is good — elements have proper dimensions allocated.',
    },
  };
  
  if (status === 'no-data') return 'Enable PerformanceObserver to collect this metric.';
  return recs[metric]?.[status] || 'Optimize according to Web.dev guidelines.';
}

export function evaluateCWVRules(crawlData: CrawlResult): any[] {
  const issues = [];
  const cwv = crawlData.cwv || {};
  
  issues.push(checkCoreWebVital('lcp', cwv.lcp, 'Largest Contentful Paint'));
  issues.push(checkCoreWebVital('inp', cwv.inp, 'Interaction to Next Paint'));
  issues.push(checkCoreWebVital('cls', cwv.cls, 'Cumulative Layout Shift'));
  issues.push(checkCoreWebVital('fcp', cwv.fcp, 'First Contentful Paint'));
  issues.push(checkCoreWebVital('ttfb', cwv.ttfb, 'Time to First Byte'));
  issues.push(checkCoreWebVital('tbt', crawlData.totalBlockingTime, 'Total Blocking Time'));

  return issues;
}
