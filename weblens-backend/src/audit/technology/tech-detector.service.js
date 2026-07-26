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
var TechDetectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechDetectorService = void 0;
const common_1 = require("@nestjs/common");
let TechDetectorService = TechDetectorService_1 = class TechDetectorService {
    logger = new common_1.Logger(TechDetectorService_1.name);
    patterns = [];
    constructor() {
        this.loadBuiltInPatterns();
    }
    loadBuiltInPatterns() {
        this.patterns = [
            {
                id: 'react',
                name: 'React',
                category: 'frontend',
                confidence: 0.9,
                patterns: [
                    { type: 'global-var', name: '__REACT_DEVTOOLS_GLOBAL_HOOK__' },
                    { type: 'global-var', name: '__NEXT_DATA__', version: true },
                    { type: 'dom-attr', name: 'data-reactroot' },
                    { type: 'dom-attr', name: 'data-reactid' },
                    { type: 'dom-element', name: '#__next' },
                    { type: 'script-src', pattern: /\/react(\.|\/)/i },
                ],
            },
            {
                id: 'vue',
                name: 'Vue.js',
                category: 'frontend',
                confidence: 0.9,
                patterns: [
                    { type: 'global-var', name: '__VUE__' },
                    { type: 'global-var', name: 'Vue' },
                    { type: 'dom-attr', name: 'data-v-', valueMatch: /^[a-f0-9]{8}$/ },
                    { type: 'dom-element', name: '#app' },
                    { type: 'comment', pattern: /<!--vue-ssr-outlet-->/ },
                ],
            },
            {
                id: 'nextjs',
                name: 'Next.js',
                category: 'frontend',
                confidence: 0.95,
                patterns: [
                    { type: 'global-var', name: '__NEXT_DATA__' },
                    { type: 'global-var', name: '__NEXT_LOADED_PAGES__' },
                    { type: 'header', name: 'x-nextjs-page' },
                    { type: 'dom-element', name: '#__next' },
                    { type: 'script-src', pattern: /\/_next\/static\/chunks\// },
                    { type: 'file-path', pattern: '/_next/static/' },
                ],
            },
            {
                id: 'wordpress',
                name: 'WordPress',
                category: 'cms',
                confidence: 0.95,
                patterns: [
                    { type: 'meta', name: 'generator', valueContains: 'WordPress' },
                    { type: 'script-src', pattern: /\/wp-content\//i },
                    { type: 'script-src', pattern: /\/wp-includes\//i },
                    { type: 'cookie', name: 'wp-settings-' },
                    { type: 'cookie', name: 'wordpress_logged_in_' },
                    { type: 'header', name: 'x-powered-by', valueContains: 'WordPress' },
                    { type: 'file-path', pattern: '/wp-content/' },
                    { type: 'file-path', pattern: '/wp-json/' },
                ],
            }
        ];
    }
    detect(crawlData) {
        this.logger.log(`Detecting technologies for ${crawlData.url}`);
        const detected = [];
        for (const pattern of this.patterns) {
            const match = this.matchPattern(pattern, crawlData);
            if (match) {
                detected.push({
                    name: pattern.name,
                    category: pattern.category,
                    confidence: this.calculateConfidence(pattern, match),
                    version: match.version,
                    evidence: match.evidence,
                    isDeprecated: pattern.isDeprecated || false,
                    endOfLife: pattern.endOfLife,
                });
            }
        }
        return this.organizeByCategory(detected);
    }
    calculateConfidence(pattern, match) {
        const ratio = match.matchCount / match.totalMethods;
        return Math.min(1, pattern.confidence * (0.5 + ratio * 0.5));
    }
    organizeByCategory(items) {
        const stack = {};
        for (const item of items) {
            if (!stack[item.category]) {
                stack[item.category] = [];
            }
            stack[item.category].push(item);
        }
        return stack;
    }
    matchPattern(pattern, data) {
        let matchCount = 0;
        const evidence = [];
        let version;
        for (const method of pattern.patterns) {
            const result = this.checkOneMethod(method, data);
            if (result.match) {
                matchCount++;
                evidence.push(result.evidence);
                if (result.version)
                    version = result.version;
            }
        }
        if (matchCount === 0)
            return null;
        return { matchCount, totalMethods: pattern.patterns.length, evidence, version };
    }
    checkOneMethod(method, data) {
        try {
            switch (method.type) {
                case 'header':
                    if (data.mainHeaders) {
                        const headerValue = data.mainHeaders[method.name.toLowerCase()];
                        if (headerValue) {
                            if (method.valueContains) {
                                if (headerValue.toLowerCase().includes(method.valueContains.toLowerCase())) {
                                    return { match: true, evidence: { type: 'header', name: method.name, value: headerValue } };
                                }
                            }
                            else {
                                return { match: true, evidence: { type: 'header', name: method.name } };
                            }
                        }
                    }
                    break;
                case 'script-src':
                    if (data.htmlContent && method.pattern.test(data.htmlContent)) {
                        return { match: true, evidence: { type: 'script-src', pattern: method.pattern.toString() } };
                    }
                    break;
                case 'meta':
                    const metaRegex = new RegExp(`<meta[^>]*name=["']${method.name}["'][^>]*content=["']([^"']*)["']`, 'i');
                    const metaMatch = data.htmlContent?.match(metaRegex);
                    if (metaMatch) {
                        if (method.valueContains) {
                            if (metaMatch[1].toLowerCase().includes(method.valueContains.toLowerCase())) {
                                return { match: true, evidence: { type: 'meta', name: method.name, value: metaMatch[1] } };
                            }
                        }
                        else {
                            return { match: true, evidence: { type: 'meta', name: method.name } };
                        }
                    }
                    break;
                default:
                    return { match: false, evidence: null };
            }
        }
        catch (e) {
            this.logger.warn(`Error checking method ${method.type}: ${e.message}`);
        }
        return { match: false, evidence: null };
    }
};
exports.TechDetectorService = TechDetectorService;
exports.TechDetectorService = TechDetectorService = TechDetectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TechDetectorService);
//# sourceMappingURL=tech-detector.service.js.map