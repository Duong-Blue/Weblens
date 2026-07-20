export interface CWVThreshold {
  good: number;
  poor: number;
  unit: string;
}

export const CWV_THRESHOLDS: Record<string, CWVThreshold> = {
  lcp: { good: 2500, poor: 4000, unit: 'ms' },
  inp: { good: 200, poor: 500, unit: 'ms' },
  cls: { good: 0.1, poor: 0.25, unit: 'score' },
  fcp: { good: 1800, poor: 3000, unit: 'ms' },
  ttfb: { good: 800, poor: 1800, unit: 'ms' },
  tbt: { good: 200, poor: 600, unit: 'ms' },
};

export function evaluateCWV(metric: string, value: number | undefined): 'pass' | 'warning' | 'fail' | 'no-data' {
  if (value === undefined || value === null) return 'no-data';
  
  const threshold = CWV_THRESHOLDS[metric];
  if (!threshold) return 'no-data';
  
  if (value <= threshold.good) return 'pass';
  if (value <= threshold.poor) return 'warning';
  return 'fail';
}
