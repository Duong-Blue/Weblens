import { AnalyzerResult, Assessment } from './index';
import { PerformanceWebVitals } from '../performance-context.interface';
import { evaluateCWV } from '../cwv-thresholds';

export class RuntimeAnalyzer {
  analyze(webVitals: PerformanceWebVitals): AnalyzerResult {
    const assessments: Record<string, Assessment> = {
      tbtSynthetic: {
        metric: 'tbtSynthetic',
        value: webVitals.tbtSynthetic,
        status: evaluateCWV('tbt', webVitals.tbtSynthetic),
        scoringFactor: false, // diagnostic only
        detail: webVitals.tbtSynthetic !== undefined ? 'Synthetic calculation' : undefined
      }
    };

    return { assessments };
  }
}