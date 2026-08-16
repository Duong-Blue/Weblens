import { EngineContext } from '../../shared/engine.types';
import { SeoCheckResult, SeoRule } from '../seo-rules';

export const PageExperienceRule: SeoRule = {
  id: 'SEO-024',
  ruleId: 'core-web-vitals',
  severity: 'high',
  weight: 10,
  title: 'Page Experience meets Core Web Vitals thresholds',
  impact: 'Google uses Core Web Vitals (LCP, INP, CLS) as a ranking factor. Poor page experience can negatively impact search rankings and user retention.',
  recommendation: 'Improve loading speed (LCP < 2.5s), visual stability (CLS < 0.1), and responsiveness (INP < 200ms).',
  evidenceType: 'performance-metric',
  additivePoints: 10,
  evaluate: (ctx: EngineContext): SeoCheckResult => {
    // Rely on crawlData.cwv
    const cwv = ctx.crawlData?.cwv;
    if (!cwv || Object.keys(cwv).length === 0) {
      return {
        passed: true, // Safe default if no data collected
        actual: 'No Core Web Vitals data collected',
        expected: 'Valid Core Web Vitals metrics (LCP, INP, CLS)',
        summary: 'Core Web Vitals were not evaluated during this crawl.',
        points: 0, // We could award full points or 0. Instructions say "bỏ qua không trừ điểm hoặc xử lý mặc định an toàn". Let's give it full 10 so we don't penalize. Wait, if points: 0, it doesn't add to score, acting as a penalty if weight is 10. Let's give points: 10.
      };
    }

    const { lcp, inp, cls } = cwv;
    let points = 10;
    const details: string[] = [];

    // Google thresholds:
    // LCP: Good <= 2500, Needs Improv <= 4000, Poor > 4000
    if (lcp !== undefined) {
      if (lcp > 4000) {
        points -= 4;
        details.push(`LCP is Poor (${(lcp / 1000).toFixed(2)}s). Target is <= 2.5s.`);
      } else if (lcp > 2500) {
        points -= 2;
        details.push(`LCP Needs Improvement (${(lcp / 1000).toFixed(2)}s). Target is <= 2.5s.`);
      }
    }

    // CLS: Good <= 0.1, Needs Improv <= 0.25, Poor > 0.25
    if (cls !== undefined) {
      if (cls > 0.25) {
        points -= 3;
        details.push(`CLS is Poor (${cls.toFixed(3)}). Target is <= 0.1.`);
      } else if (cls > 0.1) {
        points -= 1;
        details.push(`CLS Needs Improvement (${cls.toFixed(3)}). Target is <= 0.1.`);
      }
    }

    // INP: Good <= 200, Needs Improv <= 500, Poor > 500
    // (Sometimes FCP is collected instead of INP during initial load without interaction. We fallback safely if INP missing)
    if (inp !== undefined) {
      if (inp > 500) {
        points -= 3;
        details.push(`INP is Poor (${inp}ms). Target is <= 200ms.`);
      } else if (inp > 200) {
        points -= 1;
        details.push(`INP Needs Improvement (${inp}ms). Target is <= 200ms.`);
      }
    }

    points = Math.max(0, points);
    const passed = points === 10;

    return {
      passed,
      actual: `LCP: ${lcp ? lcp + 'ms' : 'N/A'}, CLS: ${cls ?? 'N/A'}, INP: ${inp ? inp + 'ms' : 'N/A'}`,
      expected: 'LCP <= 2500ms, CLS <= 0.1, INP <= 200ms',
      summary: passed
        ? 'Core Web Vitals are Good.'
        : `Core Web Vitals need improvement. Score: ${points}/10`,
      details: details.length > 0 ? details : undefined,
      points: cwv && Object.keys(cwv).length > 0 ? points : 10,
    };
  },
};