import { AuditResult, TechItem } from '../../../types/audit';

export interface ReportIssue {
  id?: string;
  category?: string;
  severity: string;
  message: string;
  description?: string;
  type?: string;
  title?: string;
  ruleId?: string;
  evidence?: any;
  recommendation?: string;
}

export const SeverityRanking: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export interface ReportModel {
  overallScore: number;
  bestPracticesScore: number;
  summaryText: string | null;
  summaryParagraphs: string[];
  generatedAtFormatted: string;
  categoryScores: {
    performance: number;
    seo: number;
    accessibility: number;
    security: number;
  };
  coreWebVitals: {
    lcp: { value: string; label: string; passed: boolean };
    cls: { value: string; label: string; passed: boolean };
    inp: { value: string; label: string; passed: boolean };
  };
  seoCriterias: { id: string; title: string; passed: boolean; label?: string }[];
  issues: ReportIssue[];
  priorityPlan: { bucket: string; issues: ReportIssue[] }[];
  improvements: { area: string; recommendations: string[] }[];
  tools: TechItem[];
  resourceBreakdown: Record<string, number>;
  loadTime?: number;
  heavyResources?: Array<{ url: string; type: string; size: number }>;
  budgetStatus?: { totalSize: number; limit: number; isOverBudget: boolean };
  seoDetails?: any;
  seoHealth?: any;
  accessibilityDetails?: {
    wcagPassRate?: number;
    ariaLabels?: { passed: boolean };
    colorContrast?: { passed: boolean };
    keyboardNav?: { passed: boolean };
  };
  securityDetails?: any;
  accWcag: any[];
  crawlData?: any;
  htmlDetails?: any;
  cssDetails?: any;
}

export function buildReportModel(
  result: AuditResult,
  opts: { auditedUrl?: string; generatedAt?: Date }
): ReportModel {
  const generatedAt = opts.generatedAt || new Date();
  
  // Safe scores
  const pScore = result.perfScore || 0;
  const sScore = result.seoScore || 0;
  const aScore = result.accScore || 0;
  const secScore = result.securityScore || 0;

  let overallScore = (result as any).overallScore;
  if (overallScore === undefined || overallScore === null) {
    overallScore = Math.round((pScore + sScore + aScore + secScore) / 4);
  }

  // Best practices (avg of html and css if available, else 0)
  const hScore = (result as any).htmlScore || 0;
  const cScore = (result as any).cssScore || 0;
  const bestPracticesScore = (hScore > 0 || cScore > 0) ? Math.round((hScore + cScore) / 2) : 0;

  // AI Summary parsing
  let summaryText: string | null = null;
  let summaryParagraphs: string[] = [];
  let improvements: { area: string; recommendations: string[] }[] = [];
  
  if (result.aiSummary) {
    try {
      const parsed = JSON.parse(result.aiSummary);
      summaryText = parsed.executiveSummary || parsed.summary || null;
      if (summaryText) {
         summaryParagraphs = summaryText.split('\n').filter(p => p.trim());
      }
      
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          improvements = [{
              area: 'General Improvements',
              recommendations: parsed.recommendations.map((r: any) => 
                  typeof r === 'string' ? r : (r.action || JSON.stringify(r))
              )
          }];
      }
      
      // Merge with aiCategoryAnalysis if present
      if (result.aiCategoryAnalysis) {
          Object.entries(result.aiCategoryAnalysis).forEach(([area, data]) => {
              if (data && data.fixRecommendations && Array.isArray(data.fixRecommendations)) {
                  improvements.push({
                      area: area.charAt(0).toUpperCase() + area.slice(1),
                      recommendations: data.fixRecommendations
                  });
              }
          });
      }
    } catch (e) {
      summaryText = result.summary || null; // Fallback
      if (summaryText) summaryParagraphs = [summaryText];
    }
  } else if (result.summary) {
      summaryText = result.summary;
      summaryParagraphs = [summaryText];
  }

  // Date formatting
  let generatedAtFormatted = '';
  try {
      generatedAtFormatted = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(generatedAt);
  } catch (e) {
      generatedAtFormatted = generatedAt.toISOString();
  }

  // Core Web Vitals
  const cwv = result.perfDetails?.coreWebVitals;
  const lcpValue = cwv?.lcp !== undefined ? cwv.lcp : null;
  const clsValue = cwv?.cls !== undefined ? cwv.cls : null;
  const inpValue = (cwv as any)?.inp !== undefined ? (cwv as any).inp : null;

  const formatMs = (val: number | null) => val !== null ? `${(val / 1000).toFixed(2)}s` : '-';
  const formatNum = (val: number | null) => val !== null ? val.toFixed(3) : '-';

  const coreWebVitals = {
    lcp: { 
        value: formatMs(lcpValue), 
        label: lcpValue !== null ? (lcpValue <= 2500 ? 'Good' : lcpValue <= 4000 ? 'Needs Improvement' : 'Poor') : 'Không xác định',
        passed: lcpValue !== null && lcpValue <= 2500
    },
    cls: { 
        value: formatNum(clsValue), 
        label: clsValue !== null ? (clsValue <= 0.1 ? 'Good' : clsValue <= 0.25 ? 'Needs Improvement' : 'Poor') : 'Không xác định',
        passed: clsValue !== null && clsValue <= 0.1
    },
    inp: { 
        value: formatMs(inpValue), 
        label: inpValue !== null ? (inpValue <= 200 ? 'Good' : inpValue <= 500 ? 'Needs Improvement' : 'Poor') : 'Không xác định',
        passed: inpValue !== null && inpValue <= 200
    }
  };

  // SEO Criteria
  const seo = result.seoDetails;
  const seoCriterias = [];
  if (seo) {
      seoCriterias.push({ id: 'title', label: 'Thẻ Title', title: 'Thẻ Title', passed: !!seo.hasTitle });
      seoCriterias.push({ id: 'meta-desc', label: 'Meta Description', title: 'Meta Description', passed: !!seo.hasMetaDescription });
      seoCriterias.push({ id: 'h1', label: 'Thẻ H1', title: 'Thẻ H1', passed: !!seo.hasH1 });
      
      const hasSocial = !!(seo.social?.openGraph?.title || seo.social?.twitter?.card);
      seoCriterias.push({ id: 'social', label: 'Mạng xã hội (OG/Twitter)', title: 'Mạng xã hội (OG/Twitter)', passed: hasSocial });
      seoCriterias.push({ id: 'json-ld', label: 'JSON-LD Structured Data', title: 'JSON-LD Structured Data', passed: !!seo.social?.hasJsonLd });
  }

  // Issues Flattening and Sorting
  const issues: ReportIssue[] = [];
  
  const collectIssues = (source: ReportIssue[] | undefined, fallbackCategory: string) => {
      if (!source || !Array.isArray(source)) return;
      source.forEach(i => {
          issues.push({
              ...i,
              category: i.category || fallbackCategory
          });
      });
  };

  collectIssues((result as any).performanceIssues, 'performance');
  collectIssues((result as any).securityIssues, 'security');
  collectIssues((result as any).accessibility, 'accessibility');
  collectIssues((result as any).htmlIssues, 'html');
  collectIssues((result as any).cssIssues, 'css');
  collectIssues((result as any).seoIssues, 'seo');

  // Sort by severity explicitly pinned to SeverityRanking
  issues.sort((a, b) => {
      const rankA = SeverityRanking[a.severity] ?? 99;
      const rankB = SeverityRanking[b.severity] ?? 99;
      return rankA - rankB;
  });

  // Priority Plan Buckets
  const priorityPlan: { bucket: string; issues: ReportIssue[] }[] = [];
  
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');

  if (criticalIssues.length > 0) priorityPlan.push({ bucket: 'Critical (Do First)', issues: criticalIssues });
  if (highIssues.length > 0) priorityPlan.push({ bucket: 'High Priority', issues: highIssues });
  if (mediumIssues.length > 0) priorityPlan.push({ bucket: 'Medium Priority', issues: mediumIssues });

  // Tools
  const tools: TechItem[] = [];
  if ((result as any).technologies && Array.isArray((result as any).technologies)) {
      tools.push(...(result as any).technologies);
  }

  // Resource Breakdown
  const resourceBreakdown: Record<string, number> = {};
  if (result.networkDetails?.summaryByType) {
      Object.assign(resourceBreakdown, result.networkDetails.summaryByType);
  }

  const accWcag = result.accDetails?.wcag || [];
  
  const crawlData = (result as any).crawlData || undefined;
  const htmlDetails = (result as any).htmlDetails || undefined;
  const cssDetails = (result as any).cssDetails || undefined;

  return {
    overallScore,
    bestPracticesScore,
    summaryText,
    summaryParagraphs,
    generatedAtFormatted,
    categoryScores: {
      performance: pScore,
      seo: sScore,
      accessibility: aScore,
      security: secScore,
    },
    coreWebVitals,
    seoCriterias,
    issues,
    priorityPlan,
    improvements,
    tools,
    resourceBreakdown,
    seoDetails: result.seoDetails || undefined,
    seoHealth: (result as any).seoHealth || undefined,
    securityDetails: result.securityDetails || undefined,
    accWcag,
    crawlData,
    htmlDetails,
    cssDetails,
  };
}
