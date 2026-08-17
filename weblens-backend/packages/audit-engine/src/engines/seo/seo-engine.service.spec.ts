import { SeoEngineService } from './seo-engine.service';
import { EngineContext } from '../shared/engine.types';
import { SeoCategory } from './seo-scoring';

describe('SeoEngineService', () => {
  let service: SeoEngineService;

  beforeEach(() => {
    service = new SeoEngineService();
  });

  const buildContext = (
    htmlContent: string,
    url = 'https://example.com',
    cwv: any = { lcp: 1000, inp: 100, cls: 0.05 },
    seoHealth: any = {}
  ): EngineContext => ({
    url,
    crawlData: {
      htmlContent,
      robotsInfo: { found: true },
      sitemapInfo: { found: true },
      cwv,
    } as any,
    seoHealth,
  });

  it('Perfect Score: returns score 100 with no failed issues for a fully optimized page', () => {
    const html = `
      <html>
        <head>
          <title>My Perfect Page Title Here Which Is Long Enough</title>
          <meta name="description" content="This is a perfect page description that is long enough to meet the fifty character limit required for best practices.">
          <link rel="canonical" href="https://example.com/">
          <meta property="og:title" content="My Perfect Page">
          <meta property="og:description" content="This is a perfect page.">
          <meta property="og:image" content="https://example.com/image.png">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="My Perfect Page">
          <meta name="twitter:description" content="This is a perfect page.">
          <script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebSite" }</script>
        </head>
        <body>
          <h1>Welcome to the Perfect Page</h1>
          <p>
            ${Array(350).fill('word').join(' ')}
          </p>
          <a href="/internal1">Link</a>
          <a href="/internal2">Link</a>
          <a href="/internal3">Link</a>
          <img src="/img.png" alt="img" />
        </body>
      </html>
    `;

    const result = service.analyze(buildContext(html));

    expect(result.score).toBe(100);
    expect(result.issues.filter((i) => i.status === 'fail')).toHaveLength(0);
  });

  it('Blocked Index: returns 0 for Indexability and total score <= 75 when BLOCKED', () => {
    const html = `
      <html>
        <head>
          <meta name="robots" content="noindex">
        </head>
        <body>
          <h1>Welcome to the Perfect Page</h1>
        </body>
      </html>
    `;

    const result = service.analyze(buildContext(html, 'https://example.com', {}, { indexability: 'BLOCKED' }));

    expect(result.score).toBeLessThanOrEqual(75);
    
    const indexIssue = result.issues.find(i => i.ruleId === 'indexability-status');
    expect(indexIssue?.status).toBe('fail');
  });

  it('Empty Data: handles empty crawlData safely without crashing', () => {
    const result = service.analyze({
      url: 'https://example.com',
      crawlData: {} as any,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('Weight Distribution: failing 1 On-page rule impacts score proportionally', () => {
    const perfectHtml = `
      <html>
        <head>
          <title>Perfect Title But Missing Meta Description!</title>
          <link rel="canonical" href="https://example.com/">
          <meta property="og:title" content="My Perfect Page">
          <meta property="og:description" content="This is a perfect page.">
          <meta property="og:image" content="https://example.com/image.png">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="My Perfect Page">
          <meta name="twitter:description" content="This is a perfect page.">
          <script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebSite" }</script>
        </head>
        <body>
          <h1>Welcome to the Perfect Page</h1>
          <p>${Array(350).fill('word').join(' ')}</p>
          <a href="/internal">Link</a>
        </body>
      </html>
    `;

    const result = service.analyze(buildContext(perfectHtml));
    const metaDescIssue = result.issues.find(i => i.ruleId === 'meta-description-optimization');
    
    expect(metaDescIssue?.status).toBe('fail');
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(90);
  });

  it('detects skipped heading levels (SEO-010)', () => {
    const html =
      '<html><body><h1>Title</h1><h3>Skipped H2</h3></body></html>';

    const result = service.analyze(buildContext(html));
    const issue = result.issues.find((i) => i.ruleId === 'heading-hierarchy');

    expect(issue?.status).toBe('fail');
    expect(issue?.evidence[0].actual).toContain('h1');
    expect(issue?.evidence[0].details?.[0]).toContain('skips from');
  });

  it('flags missing og tags via the complete check (SEO-012)', () => {
    const html =
      '<html><head><meta property="og:title" content="Title"></head><body></body></html>';

    const result = service.analyze(buildContext(html));
    const issue = result.issues.find((i) => i.ruleId === 'open-graph-complete');

    expect(issue?.status).toBe('fail');
    expect(issue?.evidence[0].details).toContain(
      'og:description is missing or empty',
    );
  });

  it('flags images without alt text (SEO-014)', () => {
    const html =
      '<html><body><img src="a.png"><img src="b.png" alt="ok"><img src="c.png" alt=""></body></html>';

    const result = service.analyze(buildContext(html));
    const issue = result.issues.find((i) => i.ruleId === 'image-alt-attributes');

    expect(issue?.status).toBe('fail');
    expect(issue?.evidence[0].actual).toContain('1 of 3');
    expect(issue?.evidence[0].details).toContain('a.png');
  });

  it('passes when every image has an alt attribute (SEO-014)', () => {
    const html =
      '<html><body><img src="a.png" alt="a"><img src="b.png" alt=""></body></html>';

    const result = service.analyze(buildContext(html));
    const issue = result.issues.find((i) => i.ruleId === 'image-alt-attributes');

    expect(issue?.status).toBe('pass');
  });

  it('flags pages dominated by external links (SEO-015)', () => {
    const html = `<html><body>
      <a href="/internal">Internal</a>
      <a href="https://other.com/a">External</a>
      <a href="https://another.org/b">External</a>
      <a href="https://elsewhere.net/c">External</a>
    </body></html>`;

    const result = service.analyze(buildContext(html));
    const issue = result.issues.find(
      (i) => i.ruleId === 'internal-external-link-ratio',
    );

    expect(issue?.status).toBe('fail');
    expect(issue?.evidence[0].actual).toContain('25% internal');
  });

  it('ContentWordCountRule: flags thin content', () => {
    const html = '<html><body><p>Too short</p></body></html>';
    const result = service.analyze(buildContext(html));
    const issue = result.issues.find(i => i.ruleId === 'content-word-count');
    
    expect(issue?.status).toBe('fail');
  });

  it('PageExperienceRule: subtracts points for poor CWV', () => {
    const result = service.analyze(buildContext('<html></html>', 'https://a.com', { lcp: 5000, cls: 0.3, inp: 600 }));
    const issue = result.issues.find(i => i.ruleId === 'core-web-vitals');
    
    expect(issue?.status).toBe('fail');
    expect(issue?.evidence[0].details).toContain('LCP is Poor (5.00s). Target is <= 2.5s.');
    expect(issue?.evidence[0].details).toContain('CLS is Poor (0.300). Target is <= 0.1.');
    expect(issue?.evidence[0].details).toContain('INP is Poor (600ms). Target is <= 200ms.');
  });
});

