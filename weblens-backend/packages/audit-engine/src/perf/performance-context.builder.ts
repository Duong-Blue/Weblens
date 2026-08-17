import type { CrawlResult } from '../interfaces/crawl-result.interface';
import { PerformanceContext, PerformanceResource, PerformanceNetworkSummary } from './performance-context.interface';

export const HEAVY_RESOURCE_THRESHOLD_BYTES = 500_000; // 500KB

export class PerformanceContextBuilder {
  build(raw: CrawlResult): PerformanceContext {
    const ctx: PerformanceContext = {
      navigation: this.buildNavigation(raw),
      paint: this.buildPaint(raw),
      webVitals: this.buildWebVitals(raw),
      runtime: this.buildRuntime(raw),
      network: this.buildNetwork(raw),
      resources: this.buildResources(raw),
      rawDebug: {
        cwv: raw.cwv,
      },
    };
    return ctx;
  }

  private buildNavigation(raw: CrawlResult) {
    if (!raw.navigationTiming) return {};
    return {
      loadTimeMs: raw.navigationTiming.loadEvent,
      domContentLoadedMs: raw.navigationTiming.domContentLoaded,
      type: raw.navigationTiming.protocol,
    };
  }

  private buildPaint(raw: CrawlResult) {
    return {
      firstContentfulPaint: raw.__perfExt?.fcp ?? raw.cwv?.fcp,
    };
  }

  private buildWebVitals(raw: CrawlResult) {
    let syntheticTbt = 0;
    if (raw.__perfExt?.longTasks) {
      const fcp = raw.__perfExt?.fcp ?? raw.cwv?.fcp ?? 0;
      for (const task of raw.__perfExt.longTasks) {
        if (task.startTime >= fcp) {
          syntheticTbt += Math.max(0, task.duration - 50);
        }
      }
    }

    return {
      lcp: raw.cwv?.lcp,
      cls: raw.cwv?.cls,
      inp: raw.cwv?.inp,
      fcp: raw.__perfExt?.fcp ?? raw.cwv?.fcp,
      ttfb: raw.navigationTiming?.ttfb,
      tbtSynthetic: syntheticTbt,
    };
  }

  private buildRuntime(raw: CrawlResult) {
    let heavyResources = 0;
    let totalSize = 0;
    if (raw.networkRequests) {
      for (const req of raw.networkRequests) {
        const size = req.transferSize || 0;
        totalSize += size;
        if (size > HEAVY_RESOURCE_THRESHOLD_BYTES) heavyResources++;
      }
    }

    return {
      heavyResources,
      budget: totalSize,
    };
  }

  private buildNetwork(raw: CrawlResult): PerformanceNetworkSummary {
    let requestsTotal = 0;
    let requestsFailed = 0;
    let transferSizeTotal = 0;
    let decodedBodySizeTotal = 0;

    if (raw.networkRequests) {
      requestsTotal = raw.networkRequests.length;
      for (const req of raw.networkRequests) {
        if (req.status >= 400) requestsFailed++;
        transferSizeTotal += req.transferSize || 0;
        decodedBodySizeTotal += req.decodedBodySize || 0;
      }
    }

    return {
      requestsTotal,
      requestsFailed,
      transferSizeTotal,
      decodedBodySizeTotal,
    };
  }

  private buildResources(raw: CrawlResult): PerformanceResource[] {
    if (!raw.networkRequests) return [];
    
    return raw.networkRequests.map((req) => ({
      name: req.url,
      entryType: 'resource',
      startTime: req.startTime || 0,
      duration: req.duration || 0,
      initiatorType: req.resourceType,
      transferSize: req.transferSize,
      decodedBodySize: req.decodedBodySize,
    }));
  }
}
