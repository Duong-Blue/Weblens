import { WebVitalsAnalyzer } from './analyzers/web-vitals.analyzer';
import { NavigationAnalyzer } from './analyzers/navigation.analyzer';
import { RuntimeAnalyzer } from './analyzers/runtime.analyzer';
import { NetworkAnalyzer } from './analyzers/network.analyzer';
import { ResourceAnalyzer } from './analyzers/resource.analyzer';
import { PerformanceContext } from './performance-context.interface';
import { PerformanceResult } from './perf-result.interface';
import { PerformanceScorer } from './performance-scorer';

export class PerformanceEngine {
  private webVitalsAnalyzer = new WebVitalsAnalyzer();
  private navigationAnalyzer = new NavigationAnalyzer();
  private runtimeAnalyzer = new RuntimeAnalyzer();
  private networkAnalyzer = new NetworkAnalyzer();
  private resourceAnalyzer = new ResourceAnalyzer();
  private scorer = new PerformanceScorer();

  run(ctx: PerformanceContext): PerformanceResult {
    const webVitalsResult = this.webVitalsAnalyzer.analyze(ctx.webVitals);
    const navResult = this.navigationAnalyzer.analyze(ctx.navigation, ctx.paint);
    const runtimeResult = this.runtimeAnalyzer.analyze(ctx.webVitals);
    const networkResult = this.networkAnalyzer.analyze(ctx.network);
    
    const originalUrl = ctx.resources.length > 0 ? ctx.resources[0].name : undefined;
    const resourceResult = this.resourceAnalyzer.analyze(ctx.resources, ctx.runtime.heavyResources ?? 0, originalUrl);

    const assessments = {
      ...webVitalsResult.assessments,
      ...navResult.assessments,
      ...runtimeResult.assessments,
      ...networkResult.assessments,
      ...resourceResult.assessments,
    };

    const metrics = {
      lcpMs: ctx.webVitals.lcp,
      cls: ctx.webVitals.cls,
      inpMs: ctx.webVitals.inp,
      fcpMs: ctx.webVitals.fcp ?? ctx.paint.firstContentfulPaint,
      ttfbMs: ctx.navigation.responseStart,
      loadEventMs: ctx.navigation.loadTimeMs,
      domContentLoadedMs: ctx.navigation.domContentLoadedMs,
      syntheticTbtMs: ctx.webVitals.tbtSynthetic,
      // longTaskCount: ctx.runtime.longTaskCount, // If we add longTaskCount to context runtime in the future
    };

    const { perfScore, scoreAvailable } = this.scorer.score(metrics);

    return {
      perfScore,
      scoreAvailable,
      metrics,
      diagnostics: {
        assessments,
        budgets: resourceResult.data || [],
      },
      issues: [],
      opportunities: [],
    };
  }
}
