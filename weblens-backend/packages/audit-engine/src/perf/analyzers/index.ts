export interface Assessment {
  metric: string;
  value?: number | string | boolean | any;
  status: 'pass' | 'warning' | 'fail' | 'no-data' | 'info';
  detail?: string;
  scoringFactor?: boolean;
}

export interface AnalyzerResult<T = any> {
  assessments: Record<string, Assessment>;
  data?: T;
}

export * from './web-vitals.analyzer';
export * from './navigation.analyzer';
export * from './runtime.analyzer';
export * from './network.analyzer';
export * from './resource.analyzer';