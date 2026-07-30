export function buildPrompt(data: any): string {
  // Extract essential data points
  const url = data.url || 'N/A';
  
  // Extract scores
  const perfScore = data.perfScore || 0;
  const seoScore = data.seoScore || 0;
  const accScore = data.accScore || 0;
  const securityScore = data.securityScore || 0;
  const overallScore = data.overallScore || 0;
  const scoreLabel = data.scoreLabel || 'N/A';
  
  // Core Web Vitals (CWV)
  const cwv = data.perfDetails?.coreWebVitals || {};
  const lcp = cwv.lcp !== undefined ? `${cwv.lcp}ms` : 'N/A';
  const cls = cwv.cls !== undefined ? cwv.cls : 'N/A';
  const inp = cwv.inp !== undefined ? `${cwv.inp}ms` : 'N/A';
  
  // Tech Stack (names only)
  const extractNames = (items: any[]) => items?.map(i => i.name).join(', ') || 'N/A';
  const frameworks = extractNames(data.techStack?.frameworks);
  const cms = extractNames(data.techStack?.cms);
  const analytics = extractNames(data.techStack?.analytics);
  
  // Structure & SEO
  const headingHierarchy = data.structureDetails?.headingHierarchy || { h1: 0, h2: 0, h3: 0 };
  const linksCount = data.seoDetails?.linksCount || 0;
  const internalLinks = data.structureDetails?.internalLinks || 0;
  const externalLinks = data.structureDetails?.externalLinks || 0;
  
  // We need to count issues manually if we have them, or use existing metrics
  // The provided interface doesn't explicitly have an "issues" array, but it has various error counts
  const jsErrors = data.jsErrorsDetails?.errorCount || 0;
  const failedRequests = data.networkDetails?.failedRequests || 0;
  const imagesWithoutAlt = data.accDetails?.imagesWithoutAlt || 0;
  const missingAriaLabels = data.accDetails?.missingAriaLabels || 0;
  
  const issueCounts = (data.issues || []).reduce((acc: any, issue: any) => {
    const sev = issue.severity || 'low';
    acc[sev] = (acc[sev] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  
  // Security vulnerabilities
  const vulnerabilities = data.securityDetails?.vulnerabilities || [];
  const top5Vulnerabilities = vulnerabilities
    .slice(0, 5)
    .map((v: any) => `- [${v.severity}] ${v.name}: ${v.description}`)
    .join('\n');
    
  // Build a minimal representation
  const minimalData = {
    URL: url,
    Điểm: {
      "Tổng": overallScore,
      "Xếp loại": scoreLabel,
      "Hiệu suất": perfScore,
      "SEO": seoScore,
      "Truy cập": accScore,
      "Bảo mật": securityScore
    },
    CWV: { LCP: lcp, CLS: cls, INP: inp },
    technologies: { frameworks: frameworks, cms: cms, analytics: analytics },
    links: {
      total: linksCount,
      internal: internalLinks,
      external: externalLinks,
    },
    Heading: `H1:${headingHierarchy.h1},H2:${headingHierarchy.h2},H3:${headingHierarchy.h3}`,
    issues: {
      jsErrors: jsErrors,
      failedRequests: failedRequests,
      imagesWithoutAlt: imagesWithoutAlt,
      missingAriaLabels: missingAriaLabels,
      topVulnerabilities: vulnerabilities.length > 0 ? '\n' + top5Vulnerabilities : "None",
      summary: issueCounts
    }
  };

  const prompt = `
Là chuyên gia AI về SEO/Web, hãy tóm tắt ngắn gọn bằng TIẾNG VIỆT các danh mục: Hiệu suất, SEO, Khả năng truy cập, Bảo mật, Công nghệ, Network, Cấu trúc, UI/UX.

Yêu cầu STRICTLY bằng JSON hợp lệ, KHÔNG bọc trong markdown code blocks.
Schema:
- "executiveSummary": string (tóm tắt)
- "uiUxAnalysis": object (nhận xét layout, typography, nav...)
- "recommendations": array of objects: "priority"("high"|"medium"|"low"), "area", "action", "impact"
- "categoryAnalysis": object với các key "performance", "seo", "accessibility", "security". 
  Mỗi key chứa object: { "analysis": string (phân tích chuyên sâu), "fixRecommendations": string[] (các bước sửa cụ thể) }

Data:
${JSON.stringify(minimalData, null, 1)}
  `;

  return prompt.trim();
}