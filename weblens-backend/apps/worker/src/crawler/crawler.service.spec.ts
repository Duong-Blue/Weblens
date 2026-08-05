import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
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
