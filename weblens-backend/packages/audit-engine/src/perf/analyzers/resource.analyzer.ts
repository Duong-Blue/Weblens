import { AnalyzerResult, Assessment } from './index';
import { PerformanceResource } from '../performance-context.interface';

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
  domNodes: { good: 800, poor: 1500, unit: '' }, // Need Context injection
  domDepth: { good: 20, poor: 32, unit: '' }, // Need Context injection
  thirdPartyScripts: { good: 5, poor: 10, unit: '' },
  thirdPartySizeKB: { good: 200, poor: 500, unit: 'KB' },
};

export class ResourceAnalyzer {
  analyze(resources: PerformanceResource[], heavyCount: number, originalUrl?: string): AnalyzerResult<BudgetCheck[]> {
    const assessments: Record<string, Assessment> = {
      heavyResources: {
        metric: 'heavyResources',
        value: heavyCount,
        status: heavyCount > 0 ? 'warning' : 'pass',
        scoringFactor: false
      }
    };

    const budgets = this.checkBudgets(resources, originalUrl);
    
    return { assessments, data: budgets };
  }

  private checkBudgets(resources: PerformanceResource[], originalUrl?: string): BudgetCheck[] {
    const metrics: Record<string, number> = {};
    
    metrics.totalRequests = resources.length;
    metrics.totalSizeKB = Math.round(resources.reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024);
    
    metrics.jsSizeKB = Math.round(resources.filter(r => r.initiatorType === 'script').reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024) || 0;
    metrics.cssSizeKB = Math.round(resources.filter(r => r.initiatorType === 'stylesheet' || r.initiatorType === 'css').reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024) || 0;
    metrics.imageSizeKB = Math.round(resources.filter(r => r.initiatorType === 'image' || r.initiatorType === 'img').reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024) || 0;
    
    if (originalUrl) {
      try {
        const originHost = new URL(originalUrl).hostname;
        const thirdPartyScripts = resources.filter(r => r.initiatorType === 'script' && this.isThirdParty(r.name, originHost));
        const thirdPartyAll = resources.filter(r => this.isThirdParty(r.name, originHost));
        
        metrics.thirdPartyScripts = thirdPartyScripts.length;
        metrics.thirdPartySizeKB = Math.round(thirdPartyAll.reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024);
      } catch {}
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

  private isThirdParty(url: string, originHost: string): boolean {
    try {
      return new URL(url).hostname !== originHost;
    } catch {
      return false;
    }
  }
}