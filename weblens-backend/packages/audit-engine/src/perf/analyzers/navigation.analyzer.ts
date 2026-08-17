import { AnalyzerResult, Assessment } from './index';
import { PerformanceNavigation, PerformancePaint } from '../performance-context.interface';
import { evaluateCWV } from '../cwv-thresholds';

export class NavigationAnalyzer {
  analyze(navigation: PerformanceNavigation, paint: PerformancePaint): AnalyzerResult {
    const assessments: Record<string, Assessment> = {
      fcp: {
        metric: 'fcp',
        value: paint.firstContentfulPaint,
        status: evaluateCWV('fcp', paint.firstContentfulPaint),
        scoringFactor: true
      },
      ttfb: {
        metric: 'ttfb',
        value: navigation.responseStart,
        status: evaluateCWV('ttfb', navigation.responseStart),
        scoringFactor: true
      },
      loadTime: {
        metric: 'loadTime',
        value: navigation.loadTimeMs,
        status: navigation.loadTimeMs ? 'info' : 'no-data',
        scoringFactor: false
      },
      domContentLoaded: {
        metric: 'domContentLoaded',
        value: navigation.domContentLoadedMs,
        status: navigation.domContentLoadedMs ? 'info' : 'no-data',
        scoringFactor: false
      }
    };

    return { assessments };
  }
}