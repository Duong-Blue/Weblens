import { SeoEngineService, EngineContext } from '@weblens/audit-engine';

describe('SeoEngineService', () => {
  let service: SeoEngineService;

  beforeEach(() => {
    service = new SeoEngineService();
  });

  it('should pass all rules and return score 100 for a perfect page', () => {
    const perfectHtml = `
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
          
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "My Perfect Page"
            }
          </script>
        </head>
        <body>
          <h1>Welcome to the Perfect Page</h1>
        </body>
      </html>
    `;

    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        htmlContent: perfectHtml,
        robotsInfo: { found: true },
        sitemapInfo: { found: true },
      } as any, // Cast to any to mock CrawlResult properties easily
    };

    const result = service.analyze(ctx);

    expect(result.score).toBe(100);
    const failedIssues = result.issues.filter(i => i.status === 'fail');
    expect(failedIssues.length).toBe(0);
  });

  it('should fail rules and return score 0 for an empty page', () => {
    const emptyHtml = `
      <html>
        <head>
        </head>
        <body>
        </body>
      </html>
    `;

    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        htmlContent: emptyHtml,
        robotsInfo: { found: false },
        sitemapInfo: { found: false },
      } as any,
    };

    const result = service.analyze(ctx);

    expect(result.score).toBe(0);
    const failedIssues = result.issues.filter(i => i.status === 'fail');
    expect(failedIssues.length).toBe(9); // 9 rules in total
  });
});
