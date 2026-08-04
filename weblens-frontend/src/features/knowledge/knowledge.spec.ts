import { describe, it, expect } from 'vitest';
import { knowledgeArticles, knowledgeForIssue, knowledgeForMetric, getKnowledge } from './knowledge';

describe('Knowledge Base Registry', () => {
  describe('Data integrity', () => {
    it('should contain all required core web vitals and technical articles', () => {
      const requiredSlugs = [
        'lcp', 'inp', 'cls', 'ttfb', 'tbt', 
        'seo-title', 'seo-meta', 'seo-jsonld', 
        'wcag-img-alt', 
        'security-hsts', 'security-csp', 'security-xframe'
      ];
      
      const availableSlugs = knowledgeArticles.map(a => a.slug);
      
      for (const slug of requiredSlugs) {
        expect(availableSlugs).toContain(slug);
      }
    });

    it('should have high quality LCP article in Vietnamese', () => {
      const lcp = getKnowledge('lcp');
      expect(lcp).toBeDefined();
      expect(lcp?.title.length).toBeGreaterThan(0);
      expect(lcp?.summary.toLowerCase()).toContain('tải chậm');
      expect(lcp?.causes.length).toBeGreaterThanOrEqual(1);
      expect(lcp?.optimize.length).toBeGreaterThanOrEqual(1);
      expect(lcp?.examples.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getKnowledge', () => {
    it('should return undefined for unknown slug', () => {
      expect(getKnowledge('unknown-slug-xyz')).toBeUndefined();
    });

    it('should return the correct article for a known slug', () => {
      expect(getKnowledge('inp')?.slug).toBe('inp');
    });
  });

  describe('knowledgeForMetric', () => {
    it('should match metric name case-insensitively', () => {
      expect(knowledgeForMetric('LCP')?.slug).toBe('lcp');
      expect(knowledgeForMetric('lcp')?.slug).toBe('lcp');
      expect(knowledgeForMetric('INP')?.slug).toBe('inp');
    });

    it('should return null for unknown metric', () => {
      expect(knowledgeForMetric('UNKNOWN_METRIC')).toBeNull();
    });
  });

  describe('knowledgeForIssue', () => {
    it('should match by ruleId substring', () => {
      expect(knowledgeForIssue({ ruleId: 'color-contrast' })).toBeNull();
      expect(knowledgeForIssue({ ruleId: 'image-alt' })?.slug).toBe('wcag-img-alt');
      expect(knowledgeForIssue({ ruleId: 'Content-Security-Policy' })?.slug).toBe('security-csp');
    });

    it('should match by id substring', () => {
      expect(knowledgeForIssue({ id: 'X-Frame-Options' })?.slug).toBe('security-xframe');
      expect(knowledgeForIssue({ id: 'document-title' })?.slug).toBe('seo-title');
    });

    it('should match LCP issue', () => {
      expect(knowledgeForIssue({ id: 'largest-contentful-paint' })?.slug).toBe('lcp');
    });

    it('should return null if nothing matches', () => {
      expect(knowledgeForIssue({ id: 'random', ruleId: 'unknown' })).toBeNull();
      expect(knowledgeForIssue({})).toBeNull();
    });
  });
});