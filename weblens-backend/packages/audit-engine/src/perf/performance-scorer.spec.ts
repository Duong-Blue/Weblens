import { PerformanceScorer, SCORING_WEIGHTS } from './performance-scorer';

describe('PerformanceScorer', () => {
  let scorer: PerformanceScorer;

  beforeEach(() => {
    scorer = new PerformanceScorer();
  });

  it('asserts that weights sum to exactly 1.00', () => {
    const sum = Object.values(SCORING_WEIGHTS).reduce((acc, val) => acc + val, 0);
    expect(sum).toBeCloseTo(1.00, 5);
  });

  it('calculates score correctly for full 5 metrics (§13 example 1)', () => {
    // Thresholds: 
    // LCP (good 2500, poor 4000). Value 2500 -> 100
    // CLS (good 0.1, poor 0.25). Value 0.16 -> (0.25-0.16)/(0.25-0.1) = 0.09/0.15 = 0.6 -> 60
    // INP (good 200, poor 500). Value 500 -> 0
    // FCP (good 1800, poor 3000). Value 2040 -> (3000-2040)/(3000-1800) = 960/1200 = 0.8 -> 80
    // TTFB (good 800, poor 1800). Value 1300 -> (1800-1300)/(1800-800) = 500/1000 = 0.5 -> 50
    const metrics = {
      lcpMs: 2500,
      cls: 0.16,
      inpMs: 500,
      fcpMs: 2040,
      ttfbMs: 1300
    };

    const result = scorer.score(metrics);
    expect(result.scoreAvailable).toBe(true);
    // Score = 0.3*100 + 0.25*60 + 0.2*0 + 0.1*80 + 0.15*50 = 30 + 15 + 0 + 8 + 7.5 = 60.5 -> round(60.5) = 61
    expect(result.perfScore).toBe(61);
  });

  it('renormalizes score correctly when INP is missing (§13 example 2)', () => {
    const metrics = {
      lcpMs: 2500,  // 100
      cls: 0.16,    // 60
      fcpMs: 2040,  // 80
      ttfbMs: 1300  // 50
    };

    const result = scorer.score(metrics);
    expect(result.scoreAvailable).toBe(true);
    // Available weight = 0.8
    // Weighted sum = 30 + 15 + 8 + 7.5 = 60.5
    // Result = 60.5 / 0.8 = 75.625 -> round(75.625) = 76
    expect(result.perfScore).toBe(76);
  });

  it('renormalizes score correctly when FCP and TTFB are missing', () => {
    const metrics = {
      lcpMs: 2500,  // 100
      cls: 0.16,    // 60
      inpMs: 500    // 0
    };

    const result = scorer.score(metrics);
    expect(result.scoreAvailable).toBe(true);
    // Available weight = 0.75
    // Weighted sum = 30 + 15 + 0 = 45
    // Result = 45 / 0.75 = 60
    expect(result.perfScore).toBe(60);
  });

  it('returns null and scoreAvailable=false when all metrics are missing', () => {
    const result = scorer.score({});
    expect(result.scoreAvailable).toBe(false);
    expect(result.perfScore).toBeNull();
  });

  it('calculates score exactly as the specific example in step 5', () => {
    // LCP 3500ms (warning) → perMetric = 100×(4000−3500)/(4000−2500) = 33.333...
    // CLS 0.05 → 100
    // INP thiếu
    // FCP 1500 → 100
    // TTFB 2000 → 100×(1800−2000)/(1800−800) = 0
    // Score = (0.3×33.333 + 0.25×100 + 0.1×100 + 0.15×0)/0.80 = (10+25+10+0)/0.80 = 56.25 → 56.
    
    const metrics = {
      lcpMs: 3500,
      cls: 0.05,
      fcpMs: 1500,
      ttfbMs: 2000
    };

    const result = scorer.score(metrics);
    expect(result.perfScore).toBe(56);
  });

  it('ensures TBT has absolutely no effect on scoring', () => {
    const metricsWithoutTbt = {
      lcpMs: 2500,
      cls: 0.1,
    };
    
    const metricsWithTbt = {
      lcpMs: 2500,
      cls: 0.1,
      syntheticTbtMs: 1000 // A terrible TBT score
    };

    const result1 = scorer.score(metricsWithoutTbt);
    const result2 = scorer.score(metricsWithTbt);
    
    expect(result1.perfScore).toBe(result2.perfScore);
  });

  it('returns deterministic results for the same input', () => {
    const metrics = {
      lcpMs: 2500,
      cls: 0.16,
      inpMs: 500,
      fcpMs: 2040,
      ttfbMs: 1300
    };

    const res1 = scorer.score(metrics);
    const res2 = scorer.score(metrics);
    expect(res1.perfScore).toBe(res2.perfScore);
  });

  it('clamps values below good to 100', () => {
    const result = scorer.score({ lcpMs: 100 }); // Way below good threshold
    expect(result.perfScore).toBe(100);
  });

  it('clamps values above poor to 0', () => {
    const result = scorer.score({ lcpMs: 10000 }); // Way above poor threshold
    expect(result.perfScore).toBe(0);
  });
});