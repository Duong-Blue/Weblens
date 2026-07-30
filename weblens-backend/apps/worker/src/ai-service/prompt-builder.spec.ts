import { buildPrompt } from './prompt-builder';

describe('prompt-builder', () => {
  const mockComprehensiveAuditData = {
    url: 'https://example.com',
    perfScore: 85,
    seoScore: 92,
    accScore: 78,
    securityScore: 65,
    overallScore: 80,
    scoreLabel: 'Good',
    perfDetails: {
      coreWebVitals: {
        lcp: 1200,
        cls: 0.05,
        inp: 45
      },
      timing: { raw: 'data' }
    },
    seoDetails: {
      linksCount: 150,
      title: 'Test',
      hasTitle: true,
      description: 'Desc',
      hasMetaDescription: true,
      hasH1: true,
      h1Count: 1
    },
    accDetails: {
      imagesWithoutAlt: 5,
      missingAriaLabels: 3,
      totalImages: 20,
      wcag: [{ criteria: '1.1.1', passed: false, message: 'fail' }]
    },
    securityDetails: {
      vulnerabilities: [
        { severity: 'critical', name: 'XSS', description: 'Cross site scripting' },
        { severity: 'high', name: 'CSRF', description: 'Cross site request forgery' },
        { severity: 'medium', name: 'CORS', description: 'Misconfigured CORS' }
      ]
    },
    techStack: {
      frameworks: [{ name: 'React', category: 'JS', confidence: 100, evidence: ['foo'] }],
      cms: [],
      analytics: [{ name: 'Google Analytics', category: 'Analytics', confidence: 100, evidence: ['bar'] }]
    },
    structureDetails: {
      internalLinks: 100,
      externalLinks: 50,
      headingHierarchy: { h1: 1, h2: 5, h3: 10 }
    },
    jsErrorsDetails: {
      errorCount: 2,
      warningCount: 5,
      errors: [{ type: 'TypeError', text: 'Cannot read properties of null', location: 'app.js:10' }]
    },
    networkDetails: {
      failedRequests: 1
    }
  };

  it('should output a string less than 2000 characters for typical data', () => {
    const prompt = buildPrompt(mockComprehensiveAuditData);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeLessThan(2000);
  });

  it('should contain all required scores and the URL', () => {
    const prompt = buildPrompt(mockComprehensiveAuditData);
    expect(prompt).toContain('https://example.com');
    expect(prompt).toContain('85'); // perf
    expect(prompt).toContain('92'); // seo
    expect(prompt).toContain('78'); // acc
    expect(prompt).toContain('65'); // security
    expect(prompt).toContain('80'); // overall
    expect(prompt).toContain('Good'); // label
  });

  it('should contain top vulnerabilities and exclude full evidence arrays or raw properties', () => {
    const prompt = buildPrompt(mockComprehensiveAuditData);
    
    // Should contain vulnerabilities
    expect(prompt).toContain('XSS');
    expect(prompt).toContain('Cross site scripting');
    
    // Should NOT contain raw/bulky fields
    expect(prompt).not.toContain('criteria'); // from wcag array
    expect(prompt).not.toContain('foo'); // from tech stack evidence
    expect(prompt).not.toContain('app.js:10'); // from js errors location
    expect(prompt).not.toContain('timing'); // from perfDetails
  });

  it('should handle empty/undefined data gracefully', () => {
    const prompt = buildPrompt({});
    
    expect(prompt).toContain('N/A');
    expect(prompt.length).toBeLessThan(2000);
    expect(prompt).toContain('None'); // For empty vulnerabilities
  });
});