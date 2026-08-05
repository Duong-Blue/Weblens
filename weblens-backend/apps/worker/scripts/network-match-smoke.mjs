import http from 'http';
import { CrawlerService } from '../dist/apps/worker/src/crawler/crawler.service.js';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html><body>
        <script>
          fetch('/api/data').catch(()=>console.log('err1'));
          fetch('/api/data').catch(()=>console.log('err2'));
          fetch('/api/data').catch(()=>console.log('err3'));
        </script>
      </body></html>
    `);
  } else if (req.url === '/api/data') {
    if (!global.reqCount) global.reqCount = 0;
    global.reqCount++;
    if (global.reqCount === 1) res.writeHead(200);
    else if (global.reqCount === 2) res.writeHead(404);
    else res.writeHead(500);
    res.end();
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  const targetUrl = `http://127.0.0.1:${port}`;
  console.log(`Stub server listening on ${port}`);

  const mockLogger = { log: console.log, error: console.error, warn: console.warn, debug: console.log };

  class TestCrawler extends CrawlerService {
    constructor() {
      super();
      this.logger = mockLogger;
    }
    async validateDomain() { return Promise.resolve(); }
    async captureSerpScreenshots() { return []; }
  }
  
  const crawler = new TestCrawler();
  
  try {
    console.log('Starting crawl against stub server...');
    const result = await crawler.crawl(targetUrl);
    
    const apiRequests = result.networkRequests.filter(r => r.url.includes('/api/data'));
    console.log(`Found ${apiRequests.length} matching /api/data requests.`);
    
    if (apiRequests.length !== 3) {
      throw new Error(`Expected 3 requests, got ${apiRequests.length}`);
    }
    
    const statuses = apiRequests.map(r => r.status).sort();
    console.log(`Statuses: ${statuses.join(', ')}`);
    
    if (statuses[0] !== 200 || statuses[1] !== 404 || statuses[2] !== 500) {
      throw new Error('Statuses did not match expected [200, 404, 500]');
    }
    
    console.log('SMOKE TEST PASSED: Duplicate URLs matched correctly!');
  } catch (e) {
    console.error('SMOKE TEST FAILED:', e);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit();
  }
});
