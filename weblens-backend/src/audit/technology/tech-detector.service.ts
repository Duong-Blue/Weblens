import { Injectable, Logger } from '@nestjs/common';

export interface TechItem {
  name: string;
  category: string;
  confidence: number;
  version?: string;
  evidence: any;
  isDeprecated: boolean;
  endOfLife?: string;
}

export interface TechnologyStack {
  frontend?: TechItem[];
  backend?: TechItem[];
  cms?: TechItem[];
  hosting?: TechItem[];
  cdn?: TechItem[];
  analytics?: TechItem[];
  payment?: TechItem[];
  security?: TechItem[];
  library?: TechItem[];
  ecommerce?: TechItem[];
  server?: TechItem[];
  [key: string]: TechItem[] | undefined;
}

export interface CrawlResult {
  url: string;
  htmlContent: string;
  mainHeaders: Record<string, string>;
  networkRequests: any[];
  cookies: any[];
  jsResources: string[];
  cssResources: string[];
}

type DetectionMethod = 
  | { type: 'global-var'; name: string; version?: boolean }
  | { type: 'script-src'; pattern: RegExp }
  | { type: 'header'; name: string; valueContains?: string }
  | { type: 'meta'; name: string; valueContains?: string }
  | { type: 'cookie'; name: string }
  | { type: 'dom-attr'; name: string; valueMatch?: RegExp }
  | { type: 'dom-element'; name: string }
  | { type: 'comment'; pattern: RegExp }
  | { type: 'file-path'; pattern: string }
  | { type: 'script-content'; pattern: RegExp };

interface DetectionPattern {
  id: string;
  name: string;
  category: string;
  version?: string;
  confidence: number;
  patterns: DetectionMethod[];
  website?: string;
  isDeprecated?: boolean;
  endOfLife?: string;
  cves?: string[];
}

interface PatternMatch {
  matchCount: number;
  totalMethods: number;
  evidence: any[];
  version?: string;
}

@Injectable()
export class TechDetectorService {
  private readonly logger = new Logger(TechDetectorService.name);
  private patterns: DetectionPattern[] = [];

  constructor() {
    this.loadBuiltInPatterns();
  }

  private loadBuiltInPatterns() {
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

  detect(crawlData: CrawlResult): TechnologyStack {
    this.logger.log(`Detecting technologies for ${crawlData.url}`);
    const detected: TechItem[] = [];

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

  private calculateConfidence(pattern: DetectionPattern, match: PatternMatch): number {
    const ratio = match.matchCount / match.totalMethods;
    return Math.min(1, pattern.confidence * (0.5 + ratio * 0.5));
  }

  private organizeByCategory(items: TechItem[]): TechnologyStack {
    const stack: TechnologyStack = {};
    for (const item of items) {
      if (!stack[item.category]) {
        stack[item.category] = [];
      }
      stack[item.category]!.push(item);
    }
    return stack;
  }

  private matchPattern(pattern: DetectionPattern, data: CrawlResult): PatternMatch | null {
    let matchCount = 0;
    const evidence: any[] = [];
    let version: string | undefined;

    for (const method of pattern.patterns) {
      const result = this.checkOneMethod(method, data);
      if (result.match) {
        matchCount++;
        evidence.push(result.evidence);
        if (result.version) version = result.version;
      }
    }

    if (matchCount === 0) return null;

    return { matchCount, totalMethods: pattern.patterns.length, evidence, version };
  }

  private checkOneMethod(method: DetectionMethod, data: CrawlResult): { match: boolean; evidence: any; version?: string } {
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
              } else {
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
          // Simple regex for meta tags
          const metaRegex = new RegExp(`<meta[^>]*name=["']${method.name}["'][^>]*content=["']([^"']*)["']`, 'i');
          const metaMatch = data.htmlContent?.match(metaRegex);
          if (metaMatch) {
             if (method.valueContains) {
                 if (metaMatch[1].toLowerCase().includes(method.valueContains.toLowerCase())) {
                     return { match: true, evidence: { type: 'meta', name: method.name, value: metaMatch[1] } };
                 }
             } else {
                 return { match: true, evidence: { type: 'meta', name: method.name } };
             }
          }
          break;
        // In a full implementation, other checks would be implemented here
        // (parsing HTML, checking cookies array, etc.)
        default:
          return { match: false, evidence: null };
      }
    } catch (e: any) {
      this.logger.warn(`Error checking method ${method.type}: ${e.message}`);
    }
    return { match: false, evidence: null };
  }
}
