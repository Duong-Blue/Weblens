import { AuditIssue } from '../types/audit.types';
import { HtmlCheckerService } from './html-checker.service';
import { CssCheckerService } from './css-checker.service';
export declare class HtmlCssMapperService {
    private readonly htmlChecker;
    private readonly cssChecker;
    constructor(htmlChecker: HtmlCheckerService, cssChecker: CssCheckerService);
    processHtmlCssAudit(crawlData: any): {
        htmlScore: number;
        cssScore: number;
        issues: AuditIssue[];
    };
    private calculateHtmlScore;
    private calculateCssScore;
}
