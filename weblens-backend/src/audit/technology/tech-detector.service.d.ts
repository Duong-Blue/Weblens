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
export declare class TechDetectorService {
    private readonly logger;
    private patterns;
    constructor();
    private loadBuiltInPatterns;
    detect(crawlData: CrawlResult): TechnologyStack;
    private calculateConfidence;
    private organizeByCategory;
    private matchPattern;
    private checkOneMethod;
}
