import { Assessment } from './analyzers';
import { BudgetCheck } from './analyzers/resource.analyzer';

export interface PerformanceResult {
  perfScore: number | null;
  scoreAvailable: boolean;
  metrics: {
    lcpMs?: number;
    cls?: number;
    inpMs?: number;
    inpSource?: string;
    fcpMs?: number;
    ttfbMs?: number;
    loadEventMs?: number;
    domContentLoadedMs?: number;
    syntheticTbtMs?: number;
    longTaskCount?: number;
  };
  diagnostics: {
    assessments: Record<string, Assessment>;
    budgets: BudgetCheck[];
  };
  issues: any[];
  opportunities: any[];
}

export type PerfEngineResult = PerformanceResult;
