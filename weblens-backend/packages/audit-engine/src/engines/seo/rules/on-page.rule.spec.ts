import { EngineContext } from '../../shared/engine.types';
import { OnPageTitleRule, OnPageMetaDescriptionRule, OnPageH1Rule } from './on-page.rule';

describe('OnPageRules', () => {
  const buildContext = (htmlContent: string): EngineContext => ({
    url: 'https://example.com',
    crawlData: {
      url: 'https://example.com',
      htmlContent,
    } as any,
  });

  describe('OnPageTitleRule', () => {
    it('should fail if no title', () => {
      const result = OnPageTitleRule.evaluate!(buildContext('<html><head></head></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
    });

    it('should fail if title is too short', () => {
      const result = OnPageTitleRule.evaluate!(buildContext('<html><head><title>Short</title></head></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(5);
      expect(result.details![0]).toContain('too short');
    });

    it('should fail if title is too long', () => {
      const title = 'A'.repeat(65);
      const result = OnPageTitleRule.evaluate!(buildContext(`<html><head><title>${title}</title></head></html>`));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(10);
      expect(result.details![0]).toContain('too long');
    });

    it('should pass if title length is optimal', () => {
      const result = OnPageTitleRule.evaluate!(buildContext('<html><head><title>Optimal Title Here</title></head></html>'));
      expect(result.passed).toBe(true);
      expect(result.points).toBe(15);
    });
  });

  describe('OnPageMetaDescriptionRule', () => {
    it('should fail if no description', () => {
      const result = OnPageMetaDescriptionRule.evaluate!(buildContext('<html><head></head></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
    });

    it('should fail if description is too short', () => {
      const result = OnPageMetaDescriptionRule.evaluate!(buildContext('<html><head><meta name="description" content="Too short"></head></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(5);
    });

    it('should fail if description is too long', () => {
      const desc = 'A'.repeat(170);
      const result = OnPageMetaDescriptionRule.evaluate!(buildContext(`<html><head><meta name="description" content="${desc}"></head></html>`));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(10);
    });

    it('should pass if description length is optimal', () => {
      const desc = 'A'.repeat(100);
      const result = OnPageMetaDescriptionRule.evaluate!(buildContext(`<html><head><meta name="description" content="${desc}"></head></html>`));
      expect(result.passed).toBe(true);
      expect(result.points).toBe(15);
    });
  });

  describe('OnPageH1Rule', () => {
    it('should fail if no H1', () => {
      const result = OnPageH1Rule.evaluate!(buildContext('<html><body></body></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
    });

    it('should fail if multiple H1s', () => {
      const result = OnPageH1Rule.evaluate!(buildContext('<html><body><h1>First</h1><h1>Second</h1></body></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
    });

    it('should fail if H1 is empty', () => {
      const result = OnPageH1Rule.evaluate!(buildContext('<html><body><h1>   </h1></body></html>'));
      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
    });

    it('should pass if exactly one non-empty H1', () => {
      const result = OnPageH1Rule.evaluate!(buildContext('<html><body><h1>Valid H1</h1></body></html>'));
      expect(result.passed).toBe(true);
      expect(result.points).toBe(10);
    });
  });
});