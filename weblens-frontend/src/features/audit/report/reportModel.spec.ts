import { describe, it, expect } from 'vitest';
import { buildReportModel, SeverityRanking } from './reportModel';
import { AuditResult } from '../../../types/audit';

describe('reportModel', () => {
    const baseResult: Partial<AuditResult> = {
    id: 'test-123',
    auditId: 'test-audit-id',
    audit: {},
    perfScore: 80,
    seoScore: 90,
    accScore: 70,
    securityScore: 60,
    perfDetails: null,
    seoDetails: null,
    accDetails: null,
    securityDetails: null,
    techStack: null,
    networkDetails: null,
    structureDetails: null,
    jsErrorsDetails: null,
    uiUxDetails: null,
    aiSummary: null,
    summary: null,
  };

  it('handles null values safely', () => {
    const nullResult = {
      id: 'test-null',
      auditId: 'test-audit-id',
      audit: {},
      perfScore: 0,
      seoScore: 0,
      accScore: 0,
      securityScore: 0,
      overallScore: 0,
      perfDetails: null,
      seoDetails: null,
      accDetails: null,
      securityDetails: null,
      techStack: null,
      networkDetails: null,
      structureDetails: null,
      jsErrorsDetails: null,
      uiUxDetails: null,
      aiSummary: null,
      summary: null,
    };
    const model = buildReportModel(nullResult as AuditResult, {});
    expect(model.overallScore).toBe(0);
    expect(model.bestPracticesScore).toBe(0);
    expect(model.summaryText).toBeNull();
    expect(model.issues).toEqual([]);
    expect(model.priorityPlan).toEqual([]);
    expect(model.improvements).toEqual([]);
    expect(model.tools).toEqual([]);
  });

  it('calculates average overall and best practices scores safely', () => {
    const result = {
      ...baseResult,
      overallScore: 75,
      htmlScore: 80,
      cssScore: 90,
    };
    const model = buildReportModel(result as AuditResult, {});
    expect(model.overallScore).toBe(75);
    expect(model.bestPracticesScore).toBe(85);
  });

  it('falls back to calculation for overall if not provided', () => {
      const model = buildReportModel(baseResult as AuditResult, {});
      expect(model.overallScore).toBe(75); // (80+90+70+60)/4
  });

  it('parses AI summary JSON correctly', () => {
    const aiSummary = JSON.stringify({ executiveSummary: 'Test summary' });
    const model = buildReportModel({ ...baseResult, aiSummary } as AuditResult, {});
    expect(model.summaryText).toBe('Test summary');
  });

  it('formats dates using vi-VN timezone', () => {
    const date = new Date('2026-08-04T12:00:00Z');
    const model = buildReportModel(baseResult as AuditResult, { generatedAt: date });
    expect(model.generatedAtFormatted).toContain('2026');
    // Ensure we have some date string, Intl behavior varies slightly by node env
    expect(model.generatedAtFormatted.length).toBeGreaterThan(0);
  });

  it('maps and sorts issues with explicit severity ranking', () => {
    const result = {
      ...baseResult,
      performanceIssues: [
        { id: '1', title: 'Low', severity: 'low', status: 'fail', category: 'performance' }
      ],
      securityIssues: [
        { id: '2', title: 'Critical', severity: 'critical', status: 'fail', category: 'security' }
      ],
      accessibility: [
        { id: '3', title: 'High', severity: 'high', status: 'fail', category: 'accessibility' },
        { id: '4', title: 'Medium', severity: 'medium', status: 'fail', category: 'accessibility' }
      ]
    };
    
    const model = buildReportModel(result as any, {});
    expect(model.issues).toHaveLength(4);
    
    // Check sorting: critical(0) -> high(1) -> medium(2) -> low(3)
    expect(model.issues[0].severity).toBe('critical');
    expect(model.issues[1].severity).toBe('high');
    expect(model.issues[2].severity).toBe('medium');
    expect(model.issues[3].severity).toBe('low');
  });

  it('generates priority plan buckets', () => {
      const result = {
        ...baseResult,
        securityIssues: [
          { id: '1', title: 'Crit Sec', severity: 'critical', status: 'fail', category: 'security', effort: 'minutes' }
        ],
        accessibility: [
          { id: '2', title: 'High A11y', severity: 'high', status: 'fail', category: 'accessibility', effort: 'hours' },
          { id: '3', title: 'Med A11y', severity: 'medium', status: 'fail', category: 'accessibility', effort: 'days' }
        ]
      };

      const model = buildReportModel(result as any, {});
      expect(model.priorityPlan).toHaveLength(3);
      expect(model.priorityPlan[0].bucket).toBe('Critical (Do First)');
      expect(model.priorityPlan[1].bucket).toBe('High Priority');
      expect(model.priorityPlan[2].bucket).toBe('Medium Priority');
  });

  it('generates SEO criteria derivation', () => {
     const result = {
       ...baseResult,
       seoDetails: {
         title: 'Test',
         hasTitle: true,
         description: 'Test desc',
         hasMetaDescription: true,
         hasH1: true,
         h1Count: 1,
         linksCount: 10,
         social: {
             openGraph: { title: 'Test OG' },
             twitter: { card: 'summary' },
             hasJsonLd: true
         }
       }
     };

     const model = buildReportModel(result as any, {});
     expect(model.seoCriterias).toHaveLength(5);
     expect(model.seoCriterias.find(c => c.id === 'title')?.passed).toBe(true);
     expect(model.seoCriterias.find(c => c.id === 'meta-desc')?.passed).toBe(true);
     expect(model.seoCriterias.find(c => c.id === 'h1')?.passed).toBe(true);
     expect(model.seoCriterias.find(c => c.id === 'social')?.passed).toBe(true);
  });

  it('generates tool list from technologies', () => {
      const result = {
          ...baseResult,
          technologies: [
              { name: 'React', category: 'Framework', confidence: 100, isDeprecated: false },
              { name: 'Next.js', category: 'Framework', confidence: 100, isDeprecated: false }
          ]
      };
      
      const model = buildReportModel(result as any, {});
      expect(model.tools).toHaveLength(2);
      expect(model.tools[0].name).toBe('React');
  });
});
