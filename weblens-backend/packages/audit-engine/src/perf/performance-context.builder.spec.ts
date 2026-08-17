import { PerformanceContextBuilder, HEAVY_RESOURCE_THRESHOLD_BYTES } from './performance-context.builder';
import type { CrawlResult } from '../interfaces/crawl-result.interface';

describe('PerformanceContextBuilder', () => {
  let builder: PerformanceContextBuilder;

  beforeEach(() => {
    builder = new PerformanceContextBuilder();
  });

  it('should build context correctly with full metrics', () => {
    const raw: CrawlResult = {
      htmlContent: '',
      consoleMessages: [],
      performanceTiming: {},
      sitemapInfo: { found: false },
      robotsInfo: { found: false },
      mainHeaders: {},
      url: 'https://example.com',
      cwv: {
        lcp: 1500,
        cls: 0.05,
        inp: 100,
        fcp: 800,
      },
      __perfExt: {
        fcp: 800,
        longTasks: [
          { startTime: 500, duration: 60 }, // Before FCP, not counted
          { startTime: 1000, duration: 100 }, // After FCP, 50ms synthetic TBT
          { startTime: 2000, duration: 40 }, // Under 50ms, 0 synthetic TBT
        ],
      },
      navigationTiming: {
        ttfb: 200,
        domContentLoaded: 600,
        loadEvent: 1200,
        protocol: 'h2',
      },
      networkRequests: [
        { url: 'https://example.com/app.js', method: 'GET', resourceType: 'script', status: 200, statusText: 'OK', transferSize: 100_000, decodedBodySize: 300_000 },
        { url: 'https://example.com/big.img', method: 'GET', resourceType: 'image', status: 200, statusText: 'OK', transferSize: HEAVY_RESOURCE_THRESHOLD_BYTES + 1, decodedBodySize: HEAVY_RESOURCE_THRESHOLD_BYTES + 1 },
        { url: 'https://example.com/api', method: 'GET', resourceType: 'fetch', status: 404, statusText: 'Not Found', transferSize: 500, decodedBodySize: 500 },
      ],
    };

    const ctx = builder.build(raw);

    // Navigation
    expect(ctx.navigation.loadTimeMs).toBe(1200);
    expect(ctx.navigation.domContentLoadedMs).toBe(600);
    expect(ctx.navigation.type).toBe('h2');

    // Paint
    expect(ctx.paint.firstContentfulPaint).toBe(800);

    // WebVitals
    expect(ctx.webVitals.lcp).toBe(1500);
    expect(ctx.webVitals.cls).toBe(0.05);
    expect(ctx.webVitals.inp).toBe(100);
    expect(ctx.webVitals.fcp).toBe(800);
    expect(ctx.webVitals.ttfb).toBe(200);
    expect(ctx.webVitals.tbtSynthetic).toBe(50); // (100 - 50) + 0

    // Runtime
    expect(ctx.runtime.heavyResources).toBe(1);
    expect(ctx.runtime.budget).toBe(100_000 + HEAVY_RESOURCE_THRESHOLD_BYTES + 1 + 500);

    // Network
    expect(ctx.network.requestsTotal).toBe(3);
    expect(ctx.network.requestsFailed).toBe(1); // 404
    expect(ctx.network.transferSizeTotal).toBe(100_000 + HEAVY_RESOURCE_THRESHOLD_BYTES + 1 + 500);
    expect(ctx.network.decodedBodySizeTotal).toBe(300_000 + HEAVY_RESOURCE_THRESHOLD_BYTES + 1 + 500);

    // Resources
    expect(ctx.resources.length).toBe(3);
    expect(ctx.resources[0].name).toBe('https://example.com/app.js');

    // Ensure no Playwright objects leaked
    expect('page' in ctx).toBe(false);
    expect('browser' in ctx).toBe(false);
  });

  it('should handle missing metrics gracefully', () => {
    const raw: CrawlResult = {
      htmlContent: '',
      consoleMessages: [],
      performanceTiming: {},
      sitemapInfo: { found: false },
      robotsInfo: { found: false },
      mainHeaders: {},
      cwv: {},
      networkRequests: [],
    };

    const ctx = builder.build(raw);

    expect(ctx.navigation.loadTimeMs).toBeUndefined();
    expect(ctx.paint.firstContentfulPaint).toBeUndefined();
    expect(ctx.webVitals.lcp).toBeUndefined();
    expect(ctx.webVitals.tbtSynthetic).toBe(0);
    expect(ctx.runtime.heavyResources).toBe(0);
    expect(ctx.network.requestsTotal).toBe(0);
    expect(ctx.resources.length).toBe(0);
  });
});