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
  seoHealth?: {
    indexability?: 'BLOCKED' | 'OK';
  };
  seoDetails?: {
    linksCount?: {
      internal: number;
      external: number;
      total: number;
    };
    openGraph?: {
      title?: string;
      description?: string;
      image?: string;
    };
    twitterCard?: {
      card?: string;
      title?: string;
      description?: string;
    };
    jsonLd?: any[];
    [key: string]: any;
  };
}
