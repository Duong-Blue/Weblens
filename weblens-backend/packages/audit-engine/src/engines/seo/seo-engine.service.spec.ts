import { SeoEngineService } from './seo-engine.service';
import { EngineContext } from '../shared/engine.types';

describe('SeoEngineService', () => {
  let service: SeoEngineService;

  beforeEach(() => {
    service = new SeoEngineService();
  });

  const buildContext = (
    htmlContent: string,
    url = 'https://example.com',
  ): EngineContext => ({
    url,
    crawlData: {
      htmlContent,
      robotsInfo: { found: true },
      sitemapInfo: { found: true },
    } as any,
  });

  it('returns score 100 with no failed issues for a fully optimized page', () => {
    const html = `
      <html>
        <head>
          <title>My Perfect Page</title>
          <meta name="description" content="This is a perfect page.">
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
        </body>
      </html>
    `;

    const result = service.analyze(buildContext(html));

    expect(result.score).toBe(100);
    expect(result.issues.filter((i) => i.status === 'fail')).toHaveLength(0);
  });

  it('returns score 0 and flags 13 rules for an empty page', () => {
    const html = '<html><head></head><body></body></html>';

    const result = service.analyze({
      url: 'https://example.com',
      crawlData: {
        htmlContent: html,
        robotsInfo: { found: false },
        sitemapInfo: { found: false },
      } as any,
    });

    expect(result.score).toBe(0);
    expect(result.issues.filter((i) => i.status === 'fail')).toHaveLength(13);
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

  it('flags a canonical that does not match the page URL (SEO-011)', () => {
    const html =
      '<html><head><link rel="canonical" href="https://example.com/other-page"></head><body></body></html>';

    const result = service.analyze(buildContext(html));
    const issue = result.issues.find((i) => i.ruleId === 'canonical-correct');

    expect(issue?.status).toBe('fail');
    expect(issue?.recommendation).toContain('https://example.com');
  });

  it('accepts a canonical that matches the page URL (SEO-011)', () => {
    const html =
      '<html><head><link rel="canonical" href="https://example.com/"></head><body></body></html>';

    const result = service.analyze(buildContext(html, 'https://example.com'));
    const issue = result.issues.find((i) => i.ruleId === 'canonical-correct');

    expect(issue?.status).toBe('pass');
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
});
