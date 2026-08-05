import http from 'http';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';
import { CrawlerService } from '../dist/apps/worker/src/crawler/crawler.service.js';
import { Test, TestingModule } from '@nestjs/testing';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/search')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (req.url.includes('example.com')) {
      res.end('<div id="search">fake results</div>');
    } else if (req.url.includes('fallback.com')) {
      // Fallback case: no #search/#rso container, only a link to the queried
      // domain. hasSerpResults must still treat this as a valid SERP.
      res.end('<a href="https://fallback.com">fallback result</a>');
    } else {
      res.end('<div>no results</div>');
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  const serpBaseUrl = `http://localhost:${port}`;
  console.log(`Stub server listening on ${port}`);

  const browser = await chromium.launch({ headless: true });
  
  // mock logger
  const mockLogger = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log,
  };

  class TestCrawler extends CrawlerService {
    constructor() {
      super();
      this.logger = mockLogger;
    }
    async testCapture(browser, url, base) {
      return this.captureSerpScreenshots(browser, url, base);
    }
  }
  
  const crawler = new TestCrawler();
  
  try {
    const res1 = await crawler.testCapture(browser, 'https://example.com', serpBaseUrl);
    console.log('res1', res1.map(r => r.path));
    
    if (res1.length !== 2) throw new Error('Expected 2 screenshots');
    if (!res1.find(r => r.viewport === 'desktop')) throw new Error('Missing desktop');
    if (!res1.find(r => r.viewport === 'mobile')) throw new Error('Missing mobile');
    
    const res2 = await crawler.testCapture(browser, 'https://notfound.com', serpBaseUrl);
    console.log('res2 length:', res2.length);
    if (res2.length !== 0) throw new Error('Expected 0 screenshots for no results');
    
    const res3 = await crawler.testCapture(browser, 'https://fallback.com', serpBaseUrl);
    console.log('res3 length:', res3.length);
    if (res3.length < 1) throw new Error('Expected at least 1 screenshot for fallback case');
    
    console.log('SMOKE TEST PASSED');
  } catch (e) {
    console.error('SMOKE TEST FAILED', e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
