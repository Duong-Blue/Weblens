import { AnalyzerResult, Assessment } from './index';
import { PerformanceNetworkSummary } from '../performance-context.interface';

export class NetworkAnalyzer {
  analyze(network: PerformanceNetworkSummary): AnalyzerResult {
    const assessments: Record<string, Assessment> = {
      requestsTotal: {
        metric: 'requestsTotal',
        value: network.requestsTotal,
        status: this.evaluateRequestCount(network.requestsTotal),
        scoringFactor: false
      },
      requestsFailed: {
        metric: 'requestsFailed',
        value: network.requestsFailed,
        status: network.requestsFailed > 0 ? 'warning' : 'pass',
        scoringFactor: false
      },
      transferSizeTotal: {
        metric: 'transferSizeTotal',
        value: network.transferSizeTotal,
        status: 'info',
        scoringFactor: false
      }
    };

    return { assessments };
  }

  private evaluateRequestCount(count: number): 'pass' | 'warning' | 'fail' {
    if (count > 200) return 'fail';
    if (count > 100) return 'warning';
    return 'pass';
  }
}