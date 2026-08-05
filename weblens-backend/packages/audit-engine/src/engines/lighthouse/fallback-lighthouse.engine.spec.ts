import { FallbackLighthouseEngine } from './fallback-lighthouse.engine';
import { CrawlResult } from '../../interfaces/crawl-result.interface';

describe('FallbackLighthouseEngine', () => {
  let engine: FallbackLighthouseEngine;

  beforeEach(() => {
    engine = new FallbackLighthouseEngine();
  });

  it('should calculate correct scores for all-good case', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [],
      consoleMessages: [],
      htmlContent: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Title 10-70 chars</title><meta name="description" content="a description"></head><body><h1>H1</h1><h2>H2</h2><img src="x" alt="x"></body></html>'
    } as any;
    const result = engine.score(input);
    expect(result.source).toBe('fallback');
    expect(result.performance).toBeNull();
    expect(result.accessibility).toBe(100);
    expect(result.bestPractices).toBe(100);
    expect(result.seo).toBe(100);
  });

  it('should calculate correct scores for all-bad case', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [
        { url: 'x', status: 404, resourceType: 'document' },
        { url: 'y', status: 404, resourceType: 'document' }
      ],
      consoleMessages: [
        { type: 'error', text: 'e1' }, { type: 'error', text: 'e2' },
        { type: 'error', text: 'e3' }, { type: 'error', text: 'e4' },
        { type: 'error', text: 'e5' },
        { type: 'warning', text: 'w1' }, { type: 'warning', text: 'w2' },
        { type: 'warning', text: 'w3' }
      ],
      htmlContent: '<html></html>'
    } as any;
    const result = engine.score(input);
    expect(result.source).toBe('fallback');
    expect(result.performance).toBeNull();
    expect(result.accessibility).toBe(35);
    expect(result.bestPractices).toBe(34);
    expect(result.seo).toBe(0);
  });

  it('should calculate correct scores for quirk meta-desc attribute order', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [],
      consoleMessages: [],
      htmlContent: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Title 10-70 chars</title><meta content="a description" name="description"></head><body><h1>H1</h1><h2>H2</h2><img src="x" alt="x"></body></html>'
    } as any;
    const result = engine.score(input);
    expect(result.seo).toBe(100);
  });

  it('should calculate correct scores for errorCount reuse', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [],
      consoleMessages: [
        { type: 'error', text: 'e1' }, { type: 'error', text: 'e2' }, { type: 'error', text: 'e3' }
      ],
      htmlContent: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Title 10-70 chars</title><meta name="description" content="a description"></head><body><h1>H1</h1><h2>H2</h2><img src="x" alt="x"></body></html>'
    } as any;
    const result = engine.score(input);
    expect(result.accessibility).toBe(85);
    expect(result.bestPractices).toBe(76);
    expect(result.seo).toBe(100);
  });

  it('should calculate correct scores for broken-links filter', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [
        { url: 'x', status: 404, resourceType: 'image' }
      ],
      consoleMessages: [],
      htmlContent: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Title 10-70 chars</title><meta name="description" content="a description"></head><body><h1>H1</h1><h2>H2</h2><img src="x" alt="x"></body></html>'
    } as any;
    const result = engine.score(input);
    expect(result.seo).toBe(100);
  });

  it('should calculate correct scores for determinism', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [],
      consoleMessages: [],
      htmlContent: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Title 10-70 chars</title><meta name="description" content="a description"></head><body><h1>H1</h1><h2>H2</h2><img src="x" alt="x"></body></html>'
    } as any;
    const result1 = engine.score(input);
    const result2 = engine.score(input);
    expect(result1).toEqual(result2);
  });

  it('should calculate correct scores for deprecated tags', () => {
    const input = {
      performanceTiming: {},
      cwv: {},
      networkRequests: [],
      consoleMessages: [],
      htmlContent: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Title 10-70 chars</title><meta name="description" content="a description"></head><body><h1>H1</h1><h2>H2</h2><img src="x" alt="x"><center></center></body></html>'
    } as any;
    const result = engine.score(input);
    expect(result.bestPractices).toBe(90);
  });
});
