import { Injectable } from '@nestjs/common';
import { CrawlResult } from '../interfaces/crawl-result.interface';
import { PerfEngineResult } from './perf-result.interface';
import { PerfEngineConfig } from './perf-config';

@Injectable()
export class PerfEngineService {
  constructor(private readonly config: PerfEngineConfig) {}

  analyze(crawlData: CrawlResult): PerfEngineResult {
    // Stub implementation
    return {
      perfScore: 100,
      issues: [],
      metrics: { lcp: 0, inp: 0, cls: 0 },
      budgets: { pass: [], warning: [], fail: [], score: 100 },
      opportunities: []
    };
  }
}
