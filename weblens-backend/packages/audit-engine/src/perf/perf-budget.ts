import { CrawlResult } from '../interfaces/crawl-result.interface';

export interface BudgetCheck {
  metric: string;
  actual: number;
  good: number;
  poor: number;
  status: 'pass' | 'warning' | 'fail';
  unit: string;
  savings?: number;
}

export const PERFORMANCE_BUDGETS = {
  totalRequests: { good: 50, poor: 100, unit: '' },
  totalSizeKB: { good: 1500, poor: 3000, unit: 'KB' },
  jsSizeKB: { good: 350, poor: 600, unit: 'KB' },
  cssSizeKB: { good: 100, poor: 200, unit: 'KB' },
  imageSizeKB: { good: 500, poor: 1000, unit: 'KB' },
  domNodes: { good: 800, poor: 1500, unit: '' },
  domDepth: { good: 20, poor: 32, unit: '' },
  thirdPartyScripts: { good: 5, poor: 10, unit: '' },
  thirdPartySizeKB: { good: 200, poor: 500, unit: 'KB' },
};

export function checkPerformanceBudgets(crawlData: CrawlResult): BudgetCheck[] {
  const metrics: Record<string, number> = {};
  
  if (crawlData.resourceBreakdown) {
    metrics.totalRequests = crawlData.resourceBreakdown.totalCount;
    metrics.totalSizeKB = Math.round((crawlData.resourceBreakdown.totalTransferSize || 0) / 1024);
    
    metrics.jsSizeKB = Math.round(crawlData.resourceBreakdown.scripts?.reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024) || 0;
    metrics.cssSizeKB = Math.round(crawlData.resourceBreakdown.stylesheets?.reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024) || 0;
    metrics.imageSizeKB = Math.round(crawlData.resourceBreakdown.images?.reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024) || 0;
    
    metrics.thirdPartySizeKB = Math.round((crawlData.resourceBreakdown.thirdPartySize || 0) / 1024);
    // Rough estimate for third-party scripts if not explicitly categorized
    metrics.thirdPartyScripts = crawlData.resourceBreakdown.scripts?.filter(s => {
       try {
           if (!crawlData.url) return false;
           return new URL(s.url).hostname !== new URL(crawlData.url).hostname;
       } catch { return false; }
    }).length || 0;
  }
  
  if (crawlData.domStats) {
    metrics.domNodes = crawlData.domStats.totalNodes;
    metrics.domDepth = crawlData.domStats.maxDepth;
  }

  return Object.entries(PERFORMANCE_BUDGETS)
    .filter(([key]) => metrics[key] !== undefined)
    .map(([key, budget]) => {
      const actual = metrics[key];
      const status = actual <= budget.good ? 'pass' 
        : actual <= budget.poor ? 'warning' 
        : 'fail';
      
      return {
        metric: key,
        actual,
        good: budget.good,
        poor: budget.poor,
        status,
        unit: budget.unit,
        savings: status !== 'pass' ? actual - budget.good : undefined,
      };
    });
}
