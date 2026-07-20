import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CrawlerService } from './crawler/crawler.service';
import { AuditLogicService } from '@weblens/audit-engine';
import { AiServiceService } from './ai-service/ai-service.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, AuditResult } from '@weblens/shared-types';

@Processor('audit-queue', { concurrency: 5, lockDuration: 30000 })
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly auditLogicService: AuditLogicService,
    private readonly aiService: AiServiceService,
    @InjectRepository(Audit) private auditRepository: Repository<Audit>,
    @InjectRepository(AuditResult) private auditResultRepository: Repository<AuditResult>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { auditId, url, anonymous } = job.data;
    
    this.logger.log(`[Job ${job.id}] Started processing audit for URL: ${url} (anonymous: ${anonymous})`);
    
    try {
      this.logger.debug(`[Job ${job.id}] Step 1: Starting crawl...`);


      if (!anonymous) {
          await this.auditRepository.update(auditId, { status: 'crawling' });
      }
      await job.updateProgress({ auditId, step: 'crawling', progress: 10, data: null });

      const crawlData = await this.crawlerService.crawl(url);
      this.logger.debug(`[Job ${job.id}] Step 1 Complete: Crawling finished successfully`);
      await job.updateProgress({ auditId, step: 'crawled', progress: 40, data: null });

      this.logger.debug(`[Job ${job.id}] Step 2: Starting analysis...`);
      if (!anonymous) {
        await this.auditRepository.update(auditId, { status: 'analyzing' });
      }

      const comprehensiveAuditData = await this.auditLogicService.performComprehensiveAudit(crawlData, url);
      this.logger.debug(`[Job ${job.id}] Step 2 Complete: Analysis finished successfully`);
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

      this.logger.debug(`[Job ${job.id}] Step 4: Saving results...`);
      if (anonymous) {
          this.logger.log(`[Job ${job.id}] Anonymous audit completed, emitting results via job progress.`);
          await job.updateProgress({ auditId, step: 'completed', progress: 100, data: resultData });
      } else {
        const newResult = this.auditResultRepository.create({
            audit: { id: auditId },
            ...resultData,
        });
        await this.auditResultRepository.save(newResult);
        await this.auditRepository.update(auditId, { status: 'completed' });
        this.logger.log(`[Job ${job.id}] Fully completed audit for URL: ${url}`);
        await job.updateProgress({ auditId, step: 'completed', progress: 100, data: JSON.parse(JSON.stringify(newResult)) });
      }

      return { success: true, result: resultData };
    } catch (error: any) {
      this.logger.error(`[Job ${job.id}] Audit failed for ${url}:`, error);
      if (!anonymous) {
        await this.auditRepository.update(auditId, { status: 'failed' });
      }
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
    this.logger.verbose(`Job ${job.id} reported progress ${job.progress}%`);
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
