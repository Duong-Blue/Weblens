export interface PerfEngineResult {
  perfScore: number;
  issues: any[];
  metrics: { lcp?: number; inp?: number; cls?: number };
  budgets: { pass: any[]; warning: any[]; fail: any[]; score: number };
  opportunities: any[];
}
