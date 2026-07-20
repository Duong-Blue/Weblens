import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QueueEvents } from 'bullmq';
import { AppGateway } from './app.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from '@weblens/shared-types';

@Injectable()
export class QueueEventsListener implements OnModuleInit {
  private readonly logger = new Logger(QueueEventsListener.name);

  constructor(
    private appGateway: AppGateway,
    @InjectRepository(Audit) private auditRepository: Repository<Audit>,
  ) {}

  onModuleInit() {
    const queueEvents = new QueueEvents('audit-queue', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    queueEvents.on('progress', async ({ jobId, data }) => {
      const payload: any = typeof data === 'string' ? JSON.parse(data) : data;
      
      const auditId = payload?.auditId || jobId;
      
      this.logger.debug(`[QueueEvents] Progress received for Job ${jobId}, Audit ${auditId} - Step: ${payload?.step}`);
      
      this.appGateway.server.emit(`audit-progress-${auditId}`, payload);
      this.appGateway.server.emit('audit-progress', payload);
    });
  }
}
