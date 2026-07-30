import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CrawlerService } from './crawler/crawler.service';
import { AuditLogicService, ScoringService, EngineScore, AxeRunnerService, WcagMapperService, HeaderCheckerService, TlsValidatorService, SecurityMapperService, HtmlCssMapperService } from '@weblens/audit-engine';
import { AiServiceService } from './ai-service/ai-service.service';
import { TechDetectorService } from '@weblens/tech-detector';
import { RedisService } from './redis/redis.service';
import { MozObservatoryService } from './ai-service/moz-observatory.service';

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
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { auditId, url, anonymous } = job.data;
    
    this.logger.log(`[Job ${job.id}] Started processing audit for URL: ${url} (anonymous: ${anonymous})`);
    
    try {
      this.logger.debug(`[Job ${job.id}] Step 1: Starting crawl...`);


      if (!anonymous) {
          // Status updates will be sent via WebSocket events and/or stored in Redis in future steps
      }
      await job.updateProgress({ auditId, step: 'crawling', progress: 10, data: null });

      const crawlData = await this.crawlerService.crawl(url);
      this.logger.debug(`[Job ${job.id}] Step 1 Complete: Crawling finished successfully`);
      await job.updateProgress({ auditId, step: 'crawled', progress: 40, data: null });

      this.logger.debug(`[Job ${job.id}] Step 2: Starting analysis...`);
      if (!anonymous) {
         // Status updates will be sent via WebSocket events and/or stored in Redis in future steps
      }

      const comprehensiveAuditData = await this.auditLogicService.performComprehensiveAudit(crawlData, url);
      
      this.logger.debug(`[Job ${job.id}] Step 2.5: Running accessibility audit...`);
      const accessibilityResults = await this.axeRunnerService.runAxeOnPage((crawlData as any).page);
      const mappedAccessibilityIssues = await this.wcagMapperService.mapAxeToIssues(accessibilityResults);
      (comprehensiveAuditData as any).accessibility = mappedAccessibilityIssues;

      this.logger.debug(`[Job ${job.id}] Step 2.6: Running security audit...`);
      const headers = (crawlData as any).headers || {};
      const tlsInfo = (crawlData as any).tlsInfo || null;
      
      const headerResults = this.headerCheckerService.checkSecurityHeaders(headers);
      const tlsResults = this.tlsValidatorService.checkTLS(tlsInfo);
      
      const allSecurityIssues = [...headerResults, ...tlsResults];
      const securityScoreResult = this.securityMapperService.calculateSecurityScore(allSecurityIssues);
      
      (comprehensiveAuditData as any).securityScore = securityScoreResult.score;
      (comprehensiveAuditData as any).securityIssues = allSecurityIssues;
      
      this.logger.debug(`[Job ${job.id}] Step 2.6.5: Calling Mozilla Observatory API...`);
      try {
        const hostname = new URL(url).hostname;
        const mozResult = await this.mozObservatoryService.analyze(hostname);
        if (mozResult) {
          (comprehensiveAuditData as any).securityMozillaGrade = mozResult.grade;
          (comprehensiveAuditData as any).securityMozillaScore = mozResult.score;
          (comprehensiveAuditData as any).securityMozillaTests = {
            passed: mozResult.testsPassed || mozResult.tests_passed,
            failed: mozResult.testsFailed || mozResult.tests_failed,
          };
        } else {
          // Fallback if API returns null
          (comprehensiveAuditData as any).securityMozillaGrade = securityScoreResult.mozillaResult.grade;
        }
      } catch (e) {
        this.logger.warn(`Mozilla Observatory failed for ${url}, using fallback grade`);
        // Fallback if unexpected error occurs
        (comprehensiveAuditData as any).securityMozillaGrade = securityScoreResult.mozillaResult.grade;
      }

      this.logger.debug(`[Job ${job.id}] Step 2.7: Running HTML/CSS audit...`);
      const htmlCssResult = this.htmlCssMapperService.processHtmlCssAudit(crawlData);

      (comprehensiveAuditData as any).htmlScore = htmlCssResult.htmlScore;
      (comprehensiveAuditData as any).htmlIssues = htmlCssResult.issues.filter(i => i.id.startsWith('HTML-'));
      (comprehensiveAuditData as any).cssScore = htmlCssResult.cssScore;
      (comprehensiveAuditData as any).cssIssues = htmlCssResult.issues.filter(i => i.id.startsWith('CSS-'));

      this.logger.debug(`[Job ${job.id}] Step 2.7.5: Detecting technology stack...`);
      const technologies = this.techDetectorService.detect((crawlData as any).htmlContent, (crawlData as any).headers || {});
      (comprehensiveAuditData as any).technologies = technologies;

      this.logger.debug(`[Job ${job.id}] Step 2.8: Calculating Final Scores...`);
      
      const engineScores: EngineScore[] = [];
      
      if ((comprehensiveAuditData as any).seoIssues) {
        engineScores.push(ScoringService.calculateEngineScore('seo', (comprehensiveAuditData as any).seoIssues));
      }
      
      const overallResult = ScoringService.calculateOverallScore(engineScores);
      (comprehensiveAuditData as any).overallScore = overallResult.overallScore;
      (comprehensiveAuditData as any).scoreLabel = overallResult.label;
      (comprehensiveAuditData as any).scoreColor = overallResult.color;
      (comprehensiveAuditData as any).scoreBreakdown = overallResult.breakdown;

      this.logger.debug(`[Job ${job.id}] Step 2 Complete: Analysis finished successfully (Score: ${overallResult.overallScore})`);
      await job.updateProgress({ auditId, step: 'analyzed', progress: 70, data: comprehensiveAuditData });

      this.logger.debug(`[Job ${job.id}] Step 3: Generating AI Summary...`);
      const aiSummary = await this.aiService.generateSummary({
        url,
        ...comprehensiveAuditData
      });
      this.logger.debug(`[Job ${job.id}] Step 3 Complete: AI Summary generated`);
      await job.updateProgress({ auditId, step: 'summarized', progress: 90, data: { aiSummary: JSON.stringify(aiSummary) } });

      let resultData: any = {
        ...comprehensiveAuditData,
        aiSummary: JSON.stringify(aiSummary),
        summary: typeof aiSummary === 'string' ? aiSummary : JSON.stringify(aiSummary),
      };

      if ((crawlData as any).browser) {
          try { await (crawlData as any).browser.close(); } catch(e) {}
      }

      this.logger.debug(`[Job ${job.id}] Step 4: Saving results to Redis...`);
      
      await this.redisService.setAuditResult(auditId, resultData);
      
      this.logger.log(`[Job ${job.id}] Fully completed audit for URL: ${url}`);
      await job.updateProgress({ auditId, step: 'completed', progress: 100, data: JSON.parse(JSON.stringify(resultData)) });

      return { success: true, result: resultData };
    } catch (error: any) {
      this.logger.error(`[Job ${job.id}] Audit failed for ${url}:`, error);

      await job.updateProgress({ 
        auditId, 
        step: 'failed', 
        progress: 100, 
        data: { errorMessage: error.message || 'Audit failed' } 
      });
      throw error;
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.verbose(`Job ${job.id} reported progress`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job?.id} failed after ${job?.attemptsMade} attempts. Reason: ${error.message}`);
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
