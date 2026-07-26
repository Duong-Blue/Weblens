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
exports.HtmlCheckerService = void 0;
const common_1 = require("@nestjs/common");
const cheerio = __importStar(require("cheerio"));
let HtmlCheckerService = class HtmlCheckerService {
    checkHTMLStructure(crawlData) {
        const issues = [];
        const html = crawlData.htmlContent || '';
        const $ = cheerio.load(html);
        const createBoolIssue = (id, ruleId, severity, weight, passed, title, impact, recommendation) => ({
            id: `HTML-${id}-${Date.now()}`,
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
            category: 'HTML Structure',
        });
        const hasDoctype = /<!doctype\s+html>/i.test(html);
        issues.push(createBoolIssue('001', 'doctype-present', 'high', 7, hasDoctype, 'HTML5 doctype is properly declared', 'Missing <!DOCTYPE html> declaration triggers quirks mode in browsers', 'Add <!DOCTYPE html> as the very first line of the document'));
        const lang = $('html').attr('lang');
        issues.push(createBoolIssue('002', 'lang-attr', 'high', 7, !!lang, `Language attribute found: ${lang || '(missing)'}`, 'Missing lang attribute affects accessibility (screen readers) and SEO', 'Add lang="[language-code]" to the <html> element'));
        const charset = $('meta[charset]').attr('charset');
        const isUtf8 = charset?.toLowerCase() === 'utf-8';
        issues.push(createBoolIssue('003', 'charset-utf8', 'high', 7, isUtf8, isUtf8 ? 'Charset is UTF-8' : `Charset: ${charset || 'missing'}`, 'Missing or incorrect charset can cause rendering issues with special characters', 'Add <meta charset="UTF-8"> as the first element in <head>'));
        const title = $('title').text();
        issues.push(createBoolIssue('005', 'title-element', 'critical', 10, title.length > 0, 'Title element found in head', 'Every page must have a <title> element in the <head> section', 'Add a descriptive <title> tag to the <head>'));
        const obsoleteTags = ['center', 'font', 'blink', 'marquee', 'strike', 'tt', 'big'];
        const foundObsolete = obsoleteTags.filter((tag) => $(tag).length > 0);
        issues.push(createBoolIssue('015', 'no-obsolete-tags', 'medium', 4, foundObsolete.length === 0, foundObsolete.length === 0
            ? 'No obsolete HTML tags found'
            : `Found obsolete tags: ${foundObsolete.join(', ')}`, 'Obsolete tags may not render correctly in modern browsers', `Replace ${foundObsolete.join(', ')} with modern CSS alternatives`));
        const semanticCount = ['main', 'nav', 'article', 'section', 'aside', 'header', 'footer'].reduce((acc, tag) => acc + $(tag).length, 0);
        issues.push(createBoolIssue('016', 'semantic-elements', 'medium', 4, semanticCount >= 3, `Found ${semanticCount} semantic elements (main, nav, article, section, etc.)`, 'Semantic HTML5 elements improve accessibility and SEO', 'Use semantic elements like <main>, <nav>, <article>, <section> instead of <div>'));
        const ids = {};
        $('[id]').each((_, el) => {
            const id = $(el).attr('id');
            if (id)
                ids[id] = (ids[id] || 0) + 1;
        });
        const duplicateIds = Object.entries(ids)
            .filter(([, count]) => count > 1)
            .map(([id]) => id);
        issues.push(createBoolIssue('018', 'unique-id', 'medium', 4, duplicateIds.length === 0, duplicateIds.length === 0
            ? 'All IDs are unique'
            : `Duplicate IDs found: ${duplicateIds.join(', ')}`, 'Duplicate IDs cause JavaScript querySelector issues and accessibility problems', 'Ensure every id attribute is unique within the document'));
        return issues;
    }
};
exports.HtmlCheckerService = HtmlCheckerService;
exports.HtmlCheckerService = HtmlCheckerService = __decorate([
    (0, common_1.Injectable)()
], HtmlCheckerService);
//# sourceMappingURL=html-checker.service.js.map