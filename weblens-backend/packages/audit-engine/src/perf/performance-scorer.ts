import { CWV_THRESHOLDS } from './cwv-thresholds';
import { PerformanceResult } from './perf-result.interface';

// ponytail: nếu có lab-TBT thật, thêm weight tbt + đổi bảng weights + kiểm tra Σ=1. Hiện tại synthetic TBT không tính điểm.
export const SCORING_WEIGHTS: Record<string, number> = {
  lcp: 0.30,
  cls: 0.25,
  inp: 0.20,
  fcp: 0.10,
  ttfb: 0.15,
};

export class PerformanceScorer {
  score(metrics: PerformanceResult['metrics']): { perfScore: number | null; scoreAvailable: boolean } {
    const rawMetrics: Record<string, number | undefined> = {
      lcp: metrics.lcpMs,
      cls: metrics.cls,
      inp: metrics.inpMs,
      fcp: metrics.fcpMs,
      ttfb: metrics.ttfbMs,
    };

    let availableWeight = 0;
    let weightedScoreSum = 0;

    for (const [key, weight] of Object.entries(SCORING_WEIGHTS)) {
      const value = rawMetrics[key];
      if (value !== undefined && value !== null) {
        availableWeight += weight;
        
        const threshold = CWV_THRESHOLDS[key];
        // Calculate normalized score [0, 100]
        let sNorm = 0;
        if (value <= threshold.good) {
          sNorm = 1;
        } else if (value >= threshold.poor) {
          sNorm = 0;
        } else {
          sNorm = (threshold.poor - value) / (threshold.poor - threshold.good);
        }
        
        const perMetricScore = sNorm * 100;
        weightedScoreSum += perMetricScore * weight;
      }
    }

    if (availableWeight === 0) {
      return { perfScore: null, scoreAvailable: false };
    }

    const perfScore = Math.round(weightedScoreSum / availableWeight);

    return { perfScore, scoreAvailable: true };
  }
}