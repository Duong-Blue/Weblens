import { PerformanceContext } from './performance-context.interface';

describe('PerformanceContext Interface', () => {
  it('should compile when all fields are present', () => {
    const ctx: PerformanceContext = {
      navigation: {
        loadTimeMs: 100,
        domContentLoadedMs: 50,
      },
      paint: {
        firstPaint: 20,
        firstContentfulPaint: 30,
      },
      webVitals: {
        lcp: 100,
        cls: 0.1,
        inp: 50,
        fcp: 30,
        ttfb: 10,
        tbt: 0,
      },
      runtime: {
        jsHeapSizeLimit: 1000,
      },
      network: {
        requestsTotal: 10,
        requestsFailed: 0,
        transferSizeTotal: 1000,
        decodedBodySizeTotal: 2000,
      },
      resources: [],
      rawDebug: {
        cwv: {
          lcp: 100,
          cls: 0.1,
          fcp: 30,
          ttfb: 10,
          fid: 50,
          totalBlockingTime: 0,
          inp: 50
        }
      }
    };
    expect(ctx).toBeDefined();
  });

  it('should compile when optional fields are missing', () => {
    const ctx: PerformanceContext = {
      navigation: {},
      paint: {},
      webVitals: {},
      runtime: {},
      network: {
        requestsTotal: 0,
        requestsFailed: 0,
        transferSizeTotal: 0,
        decodedBodySizeTotal: 0,
      },
      resources: [],
    };
    expect(ctx).toBeDefined();
  });

  it('should fail to compile when mandatory network field is missing', () => {
    // @ts-expect-error network field is required
    const ctx: PerformanceContext = {
      navigation: {},
      paint: {},
      webVitals: {},
      runtime: {},
      resources: [],
    };
    expect(ctx).toBeDefined();
  });
});