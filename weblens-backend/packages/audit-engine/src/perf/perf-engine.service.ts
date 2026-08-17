import { Injectable, Optional } from '@nestjs/common';
import { CrawlResult } from '../interfaces/crawl-result.interface';
import { PerformanceResult } from './perf-result.interface';
import { PerformanceContextBuilder } from './performance-context.builder';
import { PerformanceEngine } from './performance-engine';
import { PerformanceIssueMapper } from './performance-issue-mapper';

@Injectable()
export class PerfEngineService {
  private readonly builder = new PerformanceContextBuilder();
  private readonly engine = new PerformanceEngine();
  
  constructor() {}

  analyze(crawlData: CrawlResult): PerformanceResult {
    const ctx = this.builder.build(crawlData);
    const result = this.engine.run(ctx);
    
    const { issues, opportunities } = PerformanceIssueMapper.map(ctx);
    result.issues = issues;
    result.opportunities = opportunities;

    return result;
  }
}
