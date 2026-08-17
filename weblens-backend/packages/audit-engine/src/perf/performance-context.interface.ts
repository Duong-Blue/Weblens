import type { CrawlResult } from '../interfaces/crawl-result.interface';

export interface PerformanceNavigation {
  loadTimeMs?: number;
  domContentLoadedMs?: number;
  redirectCount?: number;
  type?: string;
  workerStart?: number;
  redirectStart?: number;
  redirectEnd?: number;
  fetchStart?: number;
  domainLookupStart?: number;
  domainLookupEnd?: number;
  connectStart?: number;
  secureConnectionStart?: number;
  connectEnd?: number;
  requestStart?: number;
  responseStart?: number;
  responseEnd?: number;
  domInteractive?: number;
  domComplete?: number;
  loadEventStart?: number;
  loadEventEnd?: number;
}

export interface PerformancePaint {
  firstPaint?: number;
  firstContentfulPaint?: number;
}

export interface PerformanceWebVitals {
  lcp?: number;
  cls?: number;
  inp?: number;
  fcp?: number;
  ttfb?: number;
  tbt?: number;
  tbtSynthetic?: number;
  fid?: number; // legacy
  totalBlockingTime?: number; // legacy
}

export interface PerformanceRuntime {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  heavyResources?: number;
  budget?: number;
}

export interface PerformanceNetworkSummary {
  requestsTotal: number;
  requestsFailed: number;
  transferSizeTotal: number;
  decodedBodySizeTotal: number;
}

export interface PerformanceResource {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  initiatorType?: string;
  transferSize?: number;
  decodedBodySize?: number;
}

export interface PerformanceContext {
  navigation: PerformanceNavigation;
  paint: PerformancePaint;
  webVitals: PerformanceWebVitals;
  runtime: PerformanceRuntime;
  network: PerformanceNetworkSummary;
  resources: PerformanceResource[];
  rawDebug?: Pick<CrawlResult, 'cwv'>;
}
