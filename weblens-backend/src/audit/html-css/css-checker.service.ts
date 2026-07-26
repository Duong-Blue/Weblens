import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { AuditIssue } from '../types/audit.types';

@Injectable()
export class CssCheckerService {
  checkCSS(crawlData: any): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const css = crawlData.cssContent || '';
    const html = crawlData.htmlContent || '';
    const $ = cheerio.load(html);

    const createBoolIssue = (
      id: string,
      ruleId: string,
      severity: 'critical' | 'high' | 'medium' | 'low',
      weight: number,
      passed: boolean,
      title: string,
      impact: string,
      recommendation: string
    ): AuditIssue => ({
      id: `CSS-${id}-${Date.now()}`,
      ruleId,
      engine: 'HTML_CSS',
      severity,
      status: passed ? 'pass' : 'fail',
      score: passed ? 1 : 0,
      weight,
      title,
      description: title,
      impact,
      recommendation,
      category: 'CSS Best Practices',
    });

    // CSS-002: Render-blocking CSS
    const externalCss = $('link[rel="stylesheet"]').length;
    const asyncCss = $('link[rel="stylesheet"][media="print"], link[rel="preload"][as="style"]').length;
    const renderBlocking = externalCss - asyncCss;
    issues.push(
      createBoolIssue(
        '002',
        'render-blocking-css',
        'high',
        7,
        renderBlocking <= 2,
        `${renderBlocking} render-blocking stylesheets found`,
        'Too many render-blocking stylesheets delay First Contentful Paint',
        'Inline critical CSS and load non-critical CSS asynchronously'
      )
    );

    // CSS-003: Minified check
    const isMinified = css.length > 0 && css.split('\n').length < Math.ceil(css.length / 200);
    issues.push(
      createBoolIssue(
        '003',
        'minified-css',
        'medium',
        4,
        isMinified,
        isMinified ? 'CSS appears to be minified' : 'CSS does not appear to be minified',
        'Unminified CSS files increase page weight and load time',
        'Minify CSS files using tools like cssnano, clean-css, or esbuild'
      )
    );

    // CSS-006: @import usage
    const importCount = (css.match(/@import\s+/g) || []).length;
    issues.push(
      createBoolIssue(
        '006',
        'no-import',
        'low',
        2,
        importCount === 0,
        importCount === 0 ? 'No @import statements found' : `Found ${importCount} @import statements`,
        '@import blocks rendering and creates dependency chains',
        'Replace @import with <link> tags in HTML'
      )
    );

    // CSS-009: Font-display
    const fontFaces = crawlData.fontFaces || [];
    const fontsWithDisplay = fontFaces.filter((f: any) => f.display === 'swap' || f.display === 'optional');
    const fontPass = fontFaces.length === 0 || fontsWithDisplay.length === fontFaces.length;
    issues.push(
      createBoolIssue(
        '009',
        'font-display-css',
        'medium',
        4,
        fontPass,
        fontPass
          ? 'All @font-face declarations use font-display'
          : `${fontsWithDisplay.length}/${fontFaces.length} fonts use font-display`,
        'Without font-display: swap, text becomes invisible while fonts load (FOUT)',
        'Add font-display: swap to all @font-face declarations'
      )
    );

    // CSS-011: Smooth animations
    const usesTransform = /transform/i.test(css);
    const usesOpacity = /opacity/i.test(css);
    const usesWidthHeight =
      /(width|height|left|right|top|bottom)\s*:\s*\d+/i.test(css) && /transition|animation/i.test(css);
    issues.push(
      createBoolIssue(
        '011',
        'animations-smooth',
        'medium',
        4,
        !usesWidthHeight,
        usesWidthHeight
          ? 'Found animations on layout properties (width/height/top/left) — may cause layout thrashing'
          : usesTransform || usesOpacity
          ? 'Animations use transform/opacity — good for performance'
          : 'No animations detected',
        'Animating layout properties triggers re-layout and repaint, hurting performance',
        'Use transform and opacity for animations instead of width, height, top, left'
      )
    );

    return issues;
  }
}
