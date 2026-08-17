import { AnalyzerResult, Assessment } from './index';
import { PerformanceWebVitals } from '../performance-context.interface';
import { evaluateCWV } from '../cwv-thresholds';

export class WebVitalsAnalyzer {
  analyze(webVitals: PerformanceWebVitals): AnalyzerResult {
    const assessments: Record<string, Assessment> = {
      lcp: {
        metric: 'lcp',
        value: webVitals.lcp,
        status: evaluateCWV('lcp', webVitals.lcp),
        scoringFactor: true
      },
      cls: {
        metric: 'cls',
        value: webVitals.cls,
        status: evaluateCWV('cls', webVitals.cls),
        scoringFactor: true
      },
      inp: {
        metric: 'inp',
        value: webVitals.inp,
        status: evaluateCWV('inp', webVitals.inp),
        scoringFactor: true
      }
    };

    return { assessments };
  }
}