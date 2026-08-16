import { IndexabilityRule } from './indexability.rule';
import { SeoEngineContext } from '../seo-rules';

describe('IndexabilityRule', () => {
  it('should pass for a fully indexable page with a canonical tag', () => {
    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        url: 'https://example.com',
        htmlContent: `
          <html>
            <head>
              <meta name="robots" content="index, follow">
              <link rel="canonical" href="https://example.com">
            </head>
            <body></body>
          </html>
        `,
      },
      seoHealth: {},
    } as any;

    const result = IndexabilityRule.evaluate!(ctx);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(25);
    expect(ctx.seoHealth?.indexability).toBeUndefined(); // Or not 'BLOCKED'
  });

  it('should fail and return 0 points if page is blocked by noindex', () => {
    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        url: 'https://example.com',
        htmlContent: `
          <html>
            <head>
              <meta name="robots" content="noindex, follow">
              <link rel="canonical" href="https://example.com">
            </head>
            <body></body>
          </html>
        `,
      },
      seoHealth: {},
    } as any;

    const result = IndexabilityRule.evaluate!(ctx);

    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(ctx.seoHealth?.indexability).toBe('BLOCKED');
    expect(result.details).toContain('Page is blocked by a "noindex" or "none" robots meta tag.');
  });

  it('should fail and return 0 points if page is blocked by robots.txt', () => {
    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        url: 'https://example.com',
        htmlContent: `
          <html>
            <head>
              <link rel="canonical" href="https://example.com">
            </head>
            <body></body>
          </html>
        `,
        robotsInfo: {
          blocked: true,
        },
      } as any,
      seoHealth: {},
    } as any;

    const result = IndexabilityRule.evaluate!(ctx);

    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(ctx.seoHealth?.indexability).toBe('BLOCKED');
    expect(result.details).toContain('Page is blocked by robots.txt.');
  });

  it('should fail if canonical tag is missing', () => {
    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        url: 'https://example.com',
        htmlContent: `
          <html>
            <head>
              <meta name="robots" content="index, follow">
            </head>
            <body></body>
          </html>
        `,
      },
      seoHealth: {},
    } as any;

    const result = IndexabilityRule.evaluate!(ctx);

    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(ctx.seoHealth?.indexability).not.toBe('BLOCKED'); // Not blocked, just missing canonical
    expect(result.details).toContain('Missing <link rel="canonical"> element.');
  });

  it('should fail if canonical tag is not absolute', () => {
    const ctx: EngineContext = {
      url: 'https://example.com',
      crawlData: {
        url: 'https://example.com',
        htmlContent: `
          <html>
            <head>
              <link rel="canonical" href="/about">
            </head>
            <body></body>
          </html>
        `,
      },
      seoHealth: {},
    } as any;

    const result = IndexabilityRule.evaluate!(ctx);

    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(result.details).toContain('Canonical href is not a valid absolute URL: /about');
  });
});
