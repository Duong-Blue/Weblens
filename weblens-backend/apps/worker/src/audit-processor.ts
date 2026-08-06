import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CrawlerService } from './crawler/crawler.service';
import { FallbackLighthouseEngine } from '@weblens/audit-engine';
import {
  AuditLogicService,
  ScoringService,
  EngineScore,
  AxeRunnerService,
  WcagMapperService,
  HeaderCheckerService,
  TlsValidatorService,
  SecurityMapperService,
  HtmlCssMapperService,
  PerfEngineService,
  SeoEngineService,
  SEO_REFERENCES,
  EngineContext,
} from '@weblens/audit-engine';
import { AiServiceService } from './ai-service/ai-service.service';
import { TechDetectorService } from '@weblens/tech-detector';
import { RedisService } from './redis/redis.service';
import { MozObservatoryService } from './ai-service/moz-observatory.service';
import { WCAG_REFERENCES } from '../../../packages/audit-engine/src/engines/accessibility/wcag-references';
import { SECURITY_REFERENCES } from '../../../packages/audit-engine/src/engines/security/security-references';
import { PERF_REFERENCES } from '../../../packages/audit-engine/src/engines/perf/perf-references';
import { ReferenceLink, AuditResult } from '@weblens/shared-types';

function detectCdn(headers: any): string | undefined {
  if (!headers) return undefined;

  // Convert headers to a case-insensitive lookup
  const h: Record<string, string> = {};
  for (const key in headers) {
    if (typeof headers[key] === 'string') {
      h[key.toLowerCase()] = headers[key].toLowerCase();
    } else if (Array.isArray(headers[key])) {
      h[key.toLowerCase()] = headers[key].join(', ').toLowerCase();
    }
  }

  if (h['cf-ray']) return 'Cloudflare';
  if (h['x-amz-cf-id']) return 'CloudFront';
  if (h['x-served-by'] && h['x-served-by'].includes('cache')) return 'Fastly';
  if (h['x-vercel-id'] || (h['server'] && h['server'].includes('vercel')))
    return 'Vercel';

  return undefined;
}


@Processor('audit-queue', { concurrency: 5, lockDuration: 30000 })
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly auditLogicService: AuditLogicService,
    private readonly aiService: AiServiceService,
    private readonly axeRunnerService: AxeRunnerService,
    private readonly wcagMapperService: WcagMapperService,
    private readonly headerCheckerService: HeaderCheckerService,
    private readonly tlsValidatorService: TlsValidatorService,
    private readonly securityMapperService: SecurityMapperService,
    private readonly htmlCssMapperService: HtmlCssMapperService,
    private readonly techDetectorService: TechDetectorService,
    private readonly redisService: RedisService,
    private readonly mozObservatoryService: MozObservatoryService,
    private readonly perfEngineService: PerfEngineService,
    private readonly seoEngineService: SeoEngineService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { auditId, url, anonymous } = job.data;

    this.logger.log(
      `[Job ${job.id}] Started processing audit for URL: ${url} (anonymous: ${anonymous})`,
    );

    try {
      this.logger.debug(`[Job ${job.id}] Step 1: Starting crawl...`);

      if (!anonymous) {
        // Status updates will be sent via WebSocket events and/or stored in Redis in future steps
      }
      await job.updateProgress({
        auditId,
        step: 'crawling',
        progress: 10,
        data: null,
      });

      const crawlData = await this.crawlerService.crawl(url);
      if (!crawlData.lighthouseData) {
        crawlData.lighthouseData =
          await FallbackLighthouseEngine.compute(crawlData);
      }
      try {
        this.logger.debug(
          `[Job ${job.id}] Step 1 Complete: Crawling finished successfully`,
        );
        await job.updateProgress({
          auditId,
          step: 'crawled',
          progress: 40,
          data: null,
        });

        this.logger.debug(`[Job ${job.id}] Step 2: Starting analysis...`);

        const comprehensiveAuditData =
          await this.auditLogicService.performComprehensiveAudit(
            crawlData,
            url,
          );

        const perfAnalysis = this.perfEngineService.analyze(crawlData);
        (comprehensiveAuditData as any).perfScore = perfAnalysis.perfScore;
        (comprehensiveAuditData as any).performanceIssues = [
          ...((comprehensiveAuditData as any).performanceIssues || []),
          ...perfAnalysis.issues,
        ];

        this.logger.debug(`[Job ${job.id}] Step 2.4: Running SEO analysis...`);
        const seoContext: EngineContext = {
          crawlData: crawlData as any,
          url: url,
          network: (crawlData as any).network,
          lighthouseData: (crawlData as any).lighthouseData,
          headers: (crawlData as any).headers,
        };
        const seoAnalysis = this.seoEngineService.analyze(seoContext);
        (comprehensiveAuditData as any).seoScore = seoAnalysis.score;
        (comprehensiveAuditData as any).seoIssues = seoAnalysis.issues;

        this.logger.debug(
          `[Job ${job.id}] Step 2.5: Running accessibility audit...`,
        );
        const accessibilityResults = await this.axeRunnerService.runAxeOnPage(
          crawlData.page,
        );
        const mappedAccessibilityIssues =
          await this.wcagMapperService.mapAxeToIssues(accessibilityResults);
        (comprehensiveAuditData as any).accessibility =
          mappedAccessibilityIssues;

        this.logger.debug(
          `[Job ${job.id}] Step 2.6: Running security audit...`,
        );
        const headers = (crawlData as any).headers || {};
        const tlsInfo = (crawlData as any).tlsInfo || null;

        const headerResults =
          this.headerCheckerService.checkSecurityHeaders(headers);
        const tlsResults = this.tlsValidatorService.checkTLS(tlsInfo);

        const allSecurityIssues = [...headerResults, ...tlsResults];
        const securityScoreResult =
          this.securityMapperService.calculateSecurityScore(allSecurityIssues);

        (comprehensiveAuditData as any).securityScore =
          securityScoreResult.score;
        (comprehensiveAuditData as any).securityIssues = allSecurityIssues;

        this.logger.debug(
          `[Job ${job.id}] Step 2.6.5: Calling Mozilla Observatory API...`,
        );
        try {
          const hostname = new URL(url).hostname;
          const mozResult = await this.mozObservatoryService.analyze(hostname);
          if (mozResult) {
            (comprehensiveAuditData as any).securityMozillaGrade =
              mozResult.grade;
            (comprehensiveAuditData as any).securityMozillaScore =
              mozResult.score;
            (comprehensiveAuditData as any).securityMozillaTests = {
              passed: mozResult.testsPassed || mozResult.tests_failed,
              failed: mozResult.testsFailed || mozResult.tests_failed,
            };
          } else {
            (comprehensiveAuditData as any).securityMozillaGrade =
              securityScoreResult.mozillaResult.grade;
          }
        } catch (e) {
          this.logger.warn(
            `Mozilla Observatory failed for ${url}, using fallback grade`,
          );
          (comprehensiveAuditData as any).securityMozillaGrade =
            securityScoreResult.mozillaResult.grade;
        }

        this.logger.debug(
          `[Job ${job.id}] Step 2.7: Running HTML/CSS audit...`,
        );
        const htmlCssResult =
          this.htmlCssMapperService.processHtmlCssAudit(crawlData);

        (comprehensiveAuditData as any).htmlScore = htmlCssResult.htmlScore;
        (comprehensiveAuditData as any).htmlIssues =
          htmlCssResult.issues.filter((i) => i.id.startsWith('HTML-'));
        (comprehensiveAuditData as any).cssScore = htmlCssResult.cssScore;
        (comprehensiveAuditData as any).cssIssues = htmlCssResult.issues.filter(
          (i) => i.id.startsWith('CSS-'),
        );

        this.logger.debug(
          `[Job ${job.id}] Step 2.7.5: Detecting technology stack...`,
        );
        const technologies = this.techDetectorService.detect(
          (crawlData as any).htmlContent,
          (crawlData as any).headers || {},
        );
        (comprehensiveAuditData as any).technologies = technologies;

        this.logger.debug(
          `[Job ${job.id}] Step 2.8: Calculating Final Scores...`,
        );

        const engineScores: EngineScore[] = [];

        if ((comprehensiveAuditData as any).seoIssues) {
          engineScores.push(
            ScoringService.calculateEngineScore(
              'seo',
              (comprehensiveAuditData as any).seoIssues,
            ),
          );
        }
        if ((comprehensiveAuditData as any).performanceIssues) {
          engineScores.push(
            ScoringService.calculateEngineScore(
              'performance',
              (comprehensiveAuditData as any).performanceIssues,
            ),
          );
        }

        const overallResult =
          ScoringService.calculateOverallScore(engineScores);
        (comprehensiveAuditData as any).overallScore =
          overallResult.overallScore;
        (comprehensiveAuditData as any).scoreLabel = overallResult.label;
        (comprehensiveAuditData as any).scoreColor = overallResult.color;
        (comprehensiveAuditData as any).scoreBreakdown =
          overallResult.breakdown;

        const referenceLinks: ReferenceLink[] = [];

        const addedRefs = new Set<string>();

        // WCAG Links
        if ((comprehensiveAuditData as any).accessibility) {
          for (const issue of (comprehensiveAuditData as any).accessibility) {
            const match = Object.entries(WCAG_REFERENCES).find(
              ([key]) => issue.id && issue.id.includes(key),
            );
            if (match && (match as any[]).length > 1 && (match as any[])[1]) {
              const m = (match as any)[1];
              if (m.url && !addedRefs.has(m.url as string)) {
                referenceLinks.push({
                  title: m.title as string,
                  url: m.url as string,
                  category: 'wcag',
                });
                addedRefs.add(m.url as string);
              }
            }
          }
        }

        // Security Links
        if ((comprehensiveAuditData as any).securityIssues) {
          for (const issue of (comprehensiveAuditData as any).securityIssues) {
            const match = Object.entries(SECURITY_REFERENCES).find(
              ([key]) => issue.id && issue.id.includes(key),
            );
            if (match && (match as any[]).length > 1 && (match as any[])[1]) {
              const m = (match as any)[1];
              if (m.url && !addedRefs.has(m.url as string)) {
                referenceLinks.push({
                  title: m.title as string,
                  url: m.url as string,
                  category: 'security',
                });
                addedRefs.add(m.url as string);
              }
            }
          }
        }

        // Perf Links
        if ((comprehensiveAuditData as any).performanceIssues) {
          for (const issue of (comprehensiveAuditData as any)
            .performanceIssues) {
            const match = Object.entries(PERF_REFERENCES).find(
              ([key]) => issue.id && issue.id.includes(key),
            );
            if (match && (match as any[]).length > 1 && (match as any[])[1]) {
              const m = (match as any)[1];
              if (m.url && !addedRefs.has(m.url as string)) {
                referenceLinks.push({
                  title: m.title as string,
                  url: m.url as string,
                  category: 'performance',
                });
                addedRefs.add(m.url as string);
              }
            }
          }
        }

        // SEO Links
        if ((comprehensiveAuditData as any).seoIssues) {
          for (const issue of (comprehensiveAuditData as any).seoIssues) {
            const match = Object.entries(SEO_REFERENCES).find(
              ([key]) => issue.id && issue.id.includes(key),
            );
            if (match && (match as any[]).length > 1 && (match as any[])[1]) {
              const m = (match as any)[1];
              if (m.url && !addedRefs.has(m.url as string)) {
                referenceLinks.push({
                  title: m.title as string,
                  url: m.url as string,
                  category: 'seo',
                });
                addedRefs.add(m.url as string);
              }
            }
          }
        }

        this.logger.debug(
          `[Job ${job.id}] Step 2 Complete: Analysis finished successfully (Score: ${overallResult.overallScore})`,
        );
        await job.updateProgress({
          auditId,
          step: 'analyzed',
          progress: 70,
          data: comprehensiveAuditData,
        });

        this.logger.debug(`[Job ${job.id}] Step 3: Generating AI Summary...`);
        const aiSummary = await this.aiService.generateSummary({
          url,
          ...comprehensiveAuditData,
        });
        this.logger.debug(
          `[Job ${job.id}] Step 3 Complete: AI Summary generated`,
        );
        await job.updateProgress({
          auditId,
          step: 'summarized',
          progress: 90,
          data: { aiSummary: JSON.stringify(aiSummary) },
        });

        const rawHeaders = (crawlData as any).headers || {};
        const serverHeader =
          (crawlData as any).mainHeaders?.server ||
          rawHeaders['server'] ||
          'Unknown';
        const cdn =
          detectCdn((crawlData as any).mainHeaders) || detectCdn(rawHeaders);
        const serverInfo = {
          server: serverHeader,
          cdn: cdn,
        };

        const resultData: AuditResult = {
          id: auditId,
          auditId: auditId,
          url: url,
          serverInfo: serverInfo,
          ...(comprehensiveAuditData as any),
          referenceLinks,
          aiSummary: JSON.stringify(aiSummary),
          aiCategoryAnalysis: aiSummary.categoryAnalysis || {},
          summary:
            typeof aiSummary === 'string'
              ? aiSummary
              : JSON.stringify(aiSummary),
        };

        this.logger.debug(`[Job ${job.id}] Step 4: Saving results to Redis...`);
        await this.redisService.setAuditResult(auditId, resultData);

        this.logger.log(
          `[Job ${job.id}] Fully completed audit for URL: ${url}`,
        );
        await job.updateProgress({ auditId, step: 'completed', progress: 100 });
        return { success: true, result: resultData };
      } finally {
        await crawlData.browser.close().catch(() => {});
      }
    } catch (error: any) {
      this.logger.error(`[Job ${job.id}] Audit failed for ${url}:`, error);

      // Save failure to Redis so frontend can retrieve it
      try {
        await this.redisService.setAuditResult(auditId, {
          error: error.message || 'Audit failed',
          status: 'failed',
          url,
        } as any);
      } catch (redisError) {
        this.logger.error(`Failed to save error to Redis: ${redisError}`);
      }

      await job.updateProgress({
        auditId,
        step: 'failed',
        progress: 100,
        data: { errorMessage: error.message || 'Audit failed' },
      });

      // DNS errors are permanent - don't retry
      if (error.message && error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        this.logger.warn(
          `[Job ${job.id}] DNS resolution failed for ${url}. Not retrying (permanent error).`,
        );
        return { success: false, error: error.message };
      }

      throw error;
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.verbose(`Job ${job.id} reported progress`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job?.id} failed after ${job?.attemptsMade} attempts. Reason: ${error.message}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} has stalled. It will be re-processed.`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker error: ${error.message}`);
  }
}
