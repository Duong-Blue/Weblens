import { Injectable } from '@nestjs/common';
import { AuditIssue } from '../../models';
import { HtmlCheckerService } from './html-checker.service';
import { CssCheckerService } from './css-checker.service';

@Injectable()
export class HtmlAnalysisEngineService {
  constructor(
    private readonly htmlChecker: HtmlCheckerService,
    private readonly cssChecker: CssCheckerService,
  ) {}

  public analyze(crawlData: any): { htmlScore: number; cssScore: number; issues: AuditIssue[] } {
    const htmlIssues = this.htmlChecker.checkHTMLStructure(crawlData);
    const cssIssues = this.cssChecker.checkCSS(crawlData);
    
    const allIssues = [...htmlIssues, ...cssIssues];
    
    return {
      htmlScore: this.calculateHtmlScore(htmlIssues),
      cssScore: this.calculateCssScore(cssIssues),
      issues: allIssues,
    };
  }

  // Keeping this for backward compatibility temporarily if something else uses it
  public processHtmlCssAudit(crawlData: any): { htmlScore: number; cssScore: number; issues: AuditIssue[] } {
    return this.analyze(crawlData);
  }

  private calculateHtmlScore(issues: AuditIssue[]): number {
    const weightMap: Record<string, number> = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 2,
    };
    let total = 0,
      earned = 0;
    for (const issue of issues) {
      const w = weightMap[issue.severity] || 4;
      total += w;
      earned += w * (issue.score || 0);
    }
    return total > 0 ? Math.round((earned / total) * 100) : 100;
  }

  private calculateCssScore(issues: AuditIssue[]): number {
    const weightMap: Record<string, number> = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 2,
    };
    let total = 0,
      earned = 0;
    for (const issue of issues) {
      const w = weightMap[issue.severity] || 4;
      total += w;
      earned += w * (issue.score || 0);
    }
    return total > 0 ? Math.round((earned / total) * 100) : 100;
  }
}
