import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService, CWV_SCRIPT } from './crawler.service';
import * as dns from 'dns';

jest.mock('get-port', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(9999)
}));

// Expose handlers globally for the test to grab
const globalHandlers: any = {};
let pageGotoResolver: any = null;

jest.mock('playwright', () => {
  const mPage = {
    on: jest.fn().mockImplementation((event: string, handler: any) => {
      if (event === 'request') globalHandlers.request = handler;
      if (event === 'response') globalHandlers.response = handler;
    }),
    addInitScript: jest.fn(),
    goto: jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        pageGotoResolver = () => resolve({ headers: () => ({}) });
      });
    }),
    evaluate: jest.fn().mockResolvedValue('{}'),
    content: jest.fn().mockResolvedValue('<html></html>'),
    waitForTimeout: jest.fn().mockResolvedValue(undefined),
  };
  const mBrowser = {
    newPage: jest.fn().mockResolvedValue(mPage),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return { chromium: { launch: jest.fn().mockResolvedValue(mBrowser) } };
});

describe('CrawlerService Network Matching', () => {
  let service: CrawlerService;

  beforeEach(async () => {
    globalHandlers.request = null;
    globalHandlers.response = null;
    pageGotoResolver = null;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerService],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
    
    service.crawl = async function(url: string) {
      const originalEval = global.eval;
      global.eval = (code: string) => {
        if (code.includes('get-port')) return Promise.resolve({ default: () => 9999 });
        if (code.includes('lighthouse')) return Promise.resolve({ default: jest.fn().mockRejectedValue(new Error('mocked')) });
        return originalEval(code);
      };
      try {
        return await CrawlerService.prototype.crawl.call(this, url);
      } finally {
        global.eval = originalEval;
      }
    };
  });

  it('should correctly match duplicate URLs using Map<Request, NetworkRequest>', async () => {
    jest.spyOn(dns.promises, 'resolve').mockResolvedValue(['127.0.0.1'] as any);
    
    (service as any).scrollPageWithLazyLoad = jest.fn().mockResolvedValue(undefined);
    (service as any).captureSerpScreenshots = jest.fn().mockResolvedValue([]);
    (service as any).fetchSitemap = jest.fn().mockResolvedValue({ found: false });
    (service as any).fetchRobotsTxt = jest.fn().mockResolvedValue({ found: false });

    // Start crawl in background. It will block at page.goto
    const crawlPromise = service.crawl('https://example.com');
    
    // Wait briefly for handlers to be attached
    await new Promise(r => setTimeout(r, 50));

    if (!globalHandlers.request) throw new Error("requestHandler not attached");
    if (!globalHandlers.response) throw new Error("responseHandler not attached");

    const targetUrl = 'https://example.com/api/data';
    const req1 = { url: () => targetUrl, method: () => 'GET', resourceType: () => 'fetch', headers: () => ({}) };
    const req2 = { url: () => targetUrl, method: () => 'GET', resourceType: () => 'fetch', headers: () => ({}) };
    const req3 = { url: () => targetUrl, method: () => 'GET', resourceType: () => 'fetch', headers: () => ({}) };
    
    globalHandlers.request(req1);
    globalHandlers.request(req2);
    globalHandlers.request(req3);

    const createResponse = (reqObj: any, status: number) => ({
      request: () => reqObj,
      url: () => targetUrl,
      status: () => status,
      statusText: () => 'OK',
      headers: () => ({}),
      serverAddr: jest.fn().mockRejectedValue(new Error()),
      securityDetails: jest.fn().mockRejectedValue(new Error()),
    });

    await globalHandlers.response(createResponse(req1, 200));
    await globalHandlers.response(createResponse(req2, 404));
    await globalHandlers.response(createResponse(req3, 500));

    if (pageGotoResolver) pageGotoResolver();

    const result = await crawlPromise;

    expect(result.networkRequests).toBeDefined();
    expect(result.networkRequests.length).toBe(3);
    expect(result.networkRequests[0].status).toBe(200);
    expect(result.networkRequests[1].status).toBe(404);
    expect(result.networkRequests[2].status).toBe(500);
  });
});

describe('CWV_SCRIPT CLS session-window algorithm', () => {
  type ObserverHarness = {
    fakeWindow: Record<string, any>;
    getObserver: (
      type: string,
    ) => ((list: { getEntries: () => any[] }) => void) | undefined;
  };

  const runHarness = (): ObserverHarness => {
    const observers: Record<
      string,
      (list: { getEntries: () => any[] }) => void
    > = {};
    function FakePerformanceObserver(
      this: {
        observe: (opts: { type: string }) => void;
      },
      callback: (list: { getEntries: () => any[] }) => void,
    ) {
      this.observe = (opts: { type: string }) => {
        observers[opts.type] = callback;
      };
    }
    const fakeWindow: Record<string, any> = {};
    new Function('window', 'PerformanceObserver', CWV_SCRIPT)(
      fakeWindow,
      FakePerformanceObserver,
    );
    return {
      fakeWindow,
      getObserver: (type: string) => observers[type],
    };
  };

  const emitEntry = (
    callback: (list: { getEntries: () => any[] }) => void,
    entry: any,
  ) => callback({ getEntries: () => [entry] });

  it('accumulates entries in the same session and resets when a gap spans >= 1s', () => {
    const { fakeWindow, getObserver } = runHarness();
    const cls = getObserver('layout-shift');
    expect(cls).toBeDefined();

    // First entry starts a session.
    emitEntry(cls, { startTime: 0, value: 0.1, hadRecentInput: false });
    expect(fakeWindow.__cwv.cls).toBeCloseTo(0.1);

    // Gap 500ms, span 500ms < 1s → still the same session.
    emitEntry(cls, { startTime: 500, value: 0.2, hadRecentInput: false });
    expect(fakeWindow.__cwv.cls).toBeCloseTo(0.3);

    // Gap 500ms -> same session (span 1000ms < 5s).
    emitEntry(cls, { startTime: 1000, value: 0.4, hadRecentInput: false });
    expect(fakeWindow.__cwv.cls).toBeCloseTo(0.7);

    // Gap 1000ms (not < 1s) -> a new session starts.
    emitEntry(cls, { startTime: 2000, value: 0.1, hadRecentInput: false });
    expect(fakeWindow.__cwv.cls).toBeCloseTo(0.1);
  });

  it('ignores entries with hadRecentInput', () => {
    const { fakeWindow, getObserver } = runHarness();
    const cls = getObserver('layout-shift');

    emitEntry(cls, { startTime: 0, value: 0.5, hadRecentInput: true });
    expect(fakeWindow.__cwv.cls).toBe(0);

    // A subsequent clean entry still seeds a session value.
    emitEntry(cls, { startTime: 100, value: 0.2, hadRecentInput: false });
    expect(fakeWindow.__cwv.cls).toBeCloseTo(0.2);
  });

  it('registers LCP and INP observers alongside CLS', () => {
    const { getObserver } = runHarness();
    expect(getObserver('largest-contentful-paint')).toBeDefined();
    expect(getObserver('first-input')).toBeDefined();
    expect(getObserver('layout-shift')).toBeDefined();
  });
});

describe('CrawlerService scrollPageWithLazyLoad', () => {
  let service: CrawlerService;

  beforeEach(() => {
    service = new CrawlerService();
  });

  it('stops at the MAX_SCROLLS bound and warns about suspected infinite scroll', async () => {
    let simulatedHeight = 12000; // grows on every read to mimic infinite scroll
    const fakePage = {
      evaluate: jest.fn((fn: any) => {
        const src = fn.toString();
        if (src.includes('document.body.scrollHeight')) {
          simulatedHeight += 10000;
          return Promise.resolve(simulatedHeight);
        }
        if (src.includes('window.innerHeight')) {
          return Promise.resolve(800);
        }
        if (src.includes('window.scrollTo')) {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      }),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
    };
    const warnSpy = jest.spyOn((service as any).logger, 'warn');

    await (service as any).scrollPageWithLazyLoad(fakePage);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Infinite scroll suspected'),
    );

    // MAX_SCROLLS (20) scroll steps + one final reset scroll.
    const scrollCalls = fakePage.evaluate.mock.calls.filter(([fn]) =>
      fn.toString().includes('window.scrollTo'),
    );
    expect(scrollCalls.length).toBe(21);
  });

  it('does not warn when the page has finite, scrollable content', async () => {
    const fakePage = {
      evaluate: jest.fn((fn: any) => {
        const src = fn.toString();
        if (src.includes('document.body.scrollHeight')) {
          return Promise.resolve(5000);
        }
        if (src.includes('window.innerHeight')) {
          return Promise.resolve(800);
        }
        if (src.includes('window.scrollTo')) {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      }),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
    };
    const warnSpy = jest.spyOn((service as any).logger, 'warn');

    await (service as any).scrollPageWithLazyLoad(fakePage);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('CrawlerService hasSerpResults', () => {
  let service: CrawlerService;

  beforeEach(() => {
    service = new CrawlerService();
  });

  const makeLocator = (countValue: number) => ({
    first: () => ({ count: () => Promise.resolve(countValue) }),
  });

  it('returns true when the Google results container is present (layer 1)', async () => {
    const fakePg = {
      locator: jest.fn((selector: string) =>
        makeLocator(selector === '#search, #rso' ? 1 : 0),
      ),
    };
    const result = await (service as any).hasSerpResults(fakePg, 'example.com');
    expect(result).toBe(true);
    expect(fakePg.locator).toHaveBeenCalledWith('#search, #rso');
    // All three layers are built eagerly, then evaluated in order.
    expect(fakePg.locator).toHaveBeenCalledTimes(3);
  });

  it('falls back to result links pointing at the domain (layer 2)', async () => {
    const fakePg = {
      locator: jest.fn((selector: string) => {
        if (selector.includes('a[href*="example.com"]')) return makeLocator(1);
        return makeLocator(0);
      }),
    };
    const result = await (service as any).hasSerpResults(fakePg, 'example.com');
    expect(result).toBe(true);
    expect(fakePg.locator).toHaveBeenCalledTimes(3);
  });

  it('falls back to Google /url?q= redirect links (layer 3)', async () => {
    const fakePg = {
      locator: jest.fn((selector: string) => {
        if (selector.includes('/url?q=')) return makeLocator(2);
        return makeLocator(0);
      }),
    };
    const result = await (service as any).hasSerpResults(fakePg, 'example.com');
    expect(result).toBe(true);
    expect(fakePg.locator).toHaveBeenCalledTimes(3);
  });

  it('returns false when all three layers fail', async () => {
    const fakePg = {
      locator: jest.fn(() => makeLocator(0)),
    };
    const result = await (service as any).hasSerpResults(fakePg, 'example.com');
    expect(result).toBe(false);
    expect(fakePg.locator).toHaveBeenCalledTimes(3);
  });
});
