import { AuditIssue } from '../../models';
import { CrawlResult, LighthouseData, NetworkRequest } from '../../interfaces/crawl-result.interface';

export interface EngineResult {
  score: number;
  issues: AuditIssue[];
}

export interface EngineContext {
  crawlData: CrawlResult;
  url: string;
  lighthouseData?: LighthouseData | null;
  network?: NetworkRequest[];
  headers?: Record<string, string>;
}
