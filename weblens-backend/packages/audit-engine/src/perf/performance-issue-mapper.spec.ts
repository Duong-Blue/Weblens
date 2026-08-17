import { PerformanceIssueMapper } from './performance-issue-mapper';
import { PerformanceContext } from './performance-context.interface';

describe('PerformanceIssueMapper', () => {
  it('should map lcp metrics correctly and deterministically', () => {
    const context: PerformanceContext = {
      webVitals: {
        lcp: 4001
      },
      navigation: {},
      paint: {},
      runtime: {},
      network: { requestsTotal: 0, requestsFailed: 0, transferSizeTotal: 0, decodedBodySizeTotal: 0 },
      resources: []
    };

    const result1 = PerformanceIssueMapper.map(context);
    const result2 = PerformanceIssueMapper.map(context);

    expect(result1.issues[0].id).toBe('PERF-LCP-01');
    expect(result1.issues[0].id).toBe(result2.issues[0].id); // Deterministic
    expect(result1.issues[0].score).toBe(0);
    expect(result1.issues[0].severity).toBe('high');
    expect(result1.issues[0].status).toBe('fail');
  });

  it('should map lcp warning correctly', () => {
    const context: PerformanceContext = {
      webVitals: {
        lcp: 3000
      },
      navigation: {},
      paint: {},
      runtime: {},
      network: { requestsTotal: 0, requestsFailed: 0, transferSizeTotal: 0, decodedBodySizeTotal: 0 },
      resources: []
    };

    const result = PerformanceIssueMapper.map(context);
    expect(result.issues[0].id).toBe('PERF-LCP-02');
    expect(result.issues[0].score).toBe(50);
    expect(result.issues[0].status).toBe('warning');
  });

  it('should map lcp pass into issues array', () => {
    const context: PerformanceContext = {
      webVitals: {
        lcp: 1500
      },
      navigation: {},
      paint: {},
      runtime: {},
      network: { requestsTotal: 0, requestsFailed: 0, transferSizeTotal: 0, decodedBodySizeTotal: 0 },
      resources: []
    };

    const result = PerformanceIssueMapper.map(context);
    expect(result.issues[0].id).toBe('PERF-LCP-00');
    expect(result.issues[0].score).toBe(100);
    expect(result.issues[0].status).toBe('pass');
  });

  it('should not create issue if no data', () => {
    const context: PerformanceContext = {
      webVitals: {},
      navigation: {},
      paint: {},
      runtime: {},
      network: { requestsTotal: 0, requestsFailed: 0, transferSizeTotal: 0, decodedBodySizeTotal: 0 },
      resources: []
    };
    const result = PerformanceIssueMapper.map(context);
    expect(result.issues.length).toBe(0);
  });

  it('should put opportunities in separate array', () => {
    const context: PerformanceContext = {
      webVitals: {},
      navigation: {},
      paint: {},
      runtime: {},
      network: { requestsTotal: 0, requestsFailed: 0, transferSizeTotal: 0, decodedBodySizeTotal: 0 },
      resources: [
        { name: 'script.js', entryType: 'resource', initiatorType: 'script', transferSize: 500 * 1024, startTime: 0, duration: 100 }
      ]
    };
    const result = PerformanceIssueMapper.map(context);
    expect(result.opportunities.length).toBe(1);
    expect(result.opportunities[0].id).toBe('PERF-RES-JS');
  });
});
