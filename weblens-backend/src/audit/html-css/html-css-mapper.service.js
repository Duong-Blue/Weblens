"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlCssMapperService = void 0;
const common_1 = require("@nestjs/common");
const html_checker_service_1 = require("./html-checker.service");
const css_checker_service_1 = require("./css-checker.service");
let HtmlCssMapperService = class HtmlCssMapperService {
    htmlChecker;
    cssChecker;
    constructor(htmlChecker, cssChecker) {
        this.htmlChecker = htmlChecker;
        this.cssChecker = cssChecker;
    }
    processHtmlCssAudit(crawlData) {
        const htmlIssues = this.htmlChecker.checkHTMLStructure(crawlData);
        const cssIssues = this.cssChecker.checkCSS(crawlData);
        const allIssues = [...htmlIssues, ...cssIssues];
        return {
            htmlScore: this.calculateHtmlScore(htmlIssues),
            cssScore: this.calculateCssScore(cssIssues),
            issues: allIssues,
        };
    }
    calculateHtmlScore(issues) {
        const weightMap = {
            critical: 10,
            high: 7,
            medium: 4,
            low: 2,
        };
        let total = 0, earned = 0;
        for (const issue of issues) {
            const w = weightMap[issue.severity] || 4;
            total += w;
            earned += w * (issue.score || 0);
        }
        return total > 0 ? Math.round((earned / total) * 100) : 100;
    }
    calculateCssScore(issues) {
        const weightMap = {
            critical: 10,
            high: 7,
            medium: 4,
            low: 2,
        };
        let total = 0, earned = 0;
        for (const issue of issues) {
            const w = weightMap[issue.severity] || 4;
            total += w;
            earned += w * (issue.score || 0);
        }
        return total > 0 ? Math.round((earned / total) * 100) : 100;
    }
};
exports.HtmlCssMapperService = HtmlCssMapperService;
exports.HtmlCssMapperService = HtmlCssMapperService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [html_checker_service_1.HtmlCheckerService,
        css_checker_service_1.CssCheckerService])
], HtmlCssMapperService);
//# sourceMappingURL=html-css-mapper.service.js.map