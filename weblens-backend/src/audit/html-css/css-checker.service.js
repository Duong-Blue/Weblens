"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssCheckerService = void 0;
const common_1 = require("@nestjs/common");
const cheerio = __importStar(require("cheerio"));
let CssCheckerService = class CssCheckerService {
    checkCSS(crawlData) {
        const issues = [];
        const css = crawlData.cssContent || '';
        const html = crawlData.htmlContent || '';
        const $ = cheerio.load(html);
        const createBoolIssue = (id, ruleId, severity, weight, passed, title, impact, recommendation) => ({
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
        const externalCss = $('link[rel="stylesheet"]').length;
        const asyncCss = $('link[rel="stylesheet"][media="print"], link[rel="preload"][as="style"]').length;
        const renderBlocking = externalCss - asyncCss;
        issues.push(createBoolIssue('002', 'render-blocking-css', 'high', 7, renderBlocking <= 2, `${renderBlocking} render-blocking stylesheets found`, 'Too many render-blocking stylesheets delay First Contentful Paint', 'Inline critical CSS and load non-critical CSS asynchronously'));
        const isMinified = css.length > 0 && css.split('\n').length < Math.ceil(css.length / 200);
        issues.push(createBoolIssue('003', 'minified-css', 'medium', 4, isMinified, isMinified ? 'CSS appears to be minified' : 'CSS does not appear to be minified', 'Unminified CSS files increase page weight and load time', 'Minify CSS files using tools like cssnano, clean-css, or esbuild'));
        const importCount = (css.match(/@import\s+/g) || []).length;
        issues.push(createBoolIssue('006', 'no-import', 'low', 2, importCount === 0, importCount === 0 ? 'No @import statements found' : `Found ${importCount} @import statements`, '@import blocks rendering and creates dependency chains', 'Replace @import with <link> tags in HTML'));
        const fontFaces = crawlData.fontFaces || [];
        const fontsWithDisplay = fontFaces.filter((f) => f.display === 'swap' || f.display === 'optional');
        const fontPass = fontFaces.length === 0 || fontsWithDisplay.length === fontFaces.length;
        issues.push(createBoolIssue('009', 'font-display-css', 'medium', 4, fontPass, fontPass
            ? 'All @font-face declarations use font-display'
            : `${fontsWithDisplay.length}/${fontFaces.length} fonts use font-display`, 'Without font-display: swap, text becomes invisible while fonts load (FOUT)', 'Add font-display: swap to all @font-face declarations'));
        const usesTransform = /transform/i.test(css);
        const usesOpacity = /opacity/i.test(css);
        const usesWidthHeight = /(width|height|left|right|top|bottom)\s*:\s*\d+/i.test(css) && /transition|animation/i.test(css);
        issues.push(createBoolIssue('011', 'animations-smooth', 'medium', 4, !usesWidthHeight, usesWidthHeight
            ? 'Found animations on layout properties (width/height/top/left) — may cause layout thrashing'
            : usesTransform || usesOpacity
                ? 'Animations use transform/opacity — good for performance'
                : 'No animations detected', 'Animating layout properties triggers re-layout and repaint, hurting performance', 'Use transform and opacity for animations instead of width, height, top, left'));
        return issues;
    }
};
exports.CssCheckerService = CssCheckerService;
exports.CssCheckerService = CssCheckerService = __decorate([
    (0, common_1.Injectable)()
], CssCheckerService);
//# sourceMappingURL=css-checker.service.js.map