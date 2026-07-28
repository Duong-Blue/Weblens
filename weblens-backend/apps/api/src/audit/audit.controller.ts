import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Throttle } from '@nestjs/throttler';
import { CreateAuditDto } from './dto/create-audit.dto';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';

@Controller('audits')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(
    @InjectQueue('audit-queue') private readonly auditQueue: Queue,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createAudit(
    @Body() body: CreateAuditDto,
    @Req() req: Request,
  ): Promise<{ message: string; audit: any }> {
    let formattedUrl = body.url.trim();
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://')
    ) {
      formattedUrl = 'https://' + formattedUrl;
    }

    this.logger.log(`Received audit request for URL: ${formattedUrl}`);

    const generatedId = randomUUID();
    this.logger.log(`Created anonymous audit object with ID: ${generatedId}`);

    const partialAudit = {
      id: generatedId,
      url: formattedUrl,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.auditQueue.add(
      'process-audit',
      {
        auditId: generatedId,
        url: formattedUrl,
        anonymous: true,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`Added anonymous audit job ${generatedId} to queue`);

    return {
      message: 'Anonymous audit job created successfully',
      audit: partialAudit,
    };
  }

  @Get(':id/result')
  async getAuditResult(
    @Param('id') id: string,
  ): Promise<{ audit: any; result: any | null }> {
    const result = await this.redisService.getAuditResult(id);
    
    if (!result) {
      return {
        audit: { id, status: 'pending_or_not_found' },
        result: null,
      };
    }

    return {
      audit: { id, status: 'completed' },
      result: result,
    };
  }

  @Get(':id/export')
  async exportAuditResult(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.redisService.getAuditResult(id);
    
    if (!result) {
      throw new NotFoundException(`Audit result for ${id} not found or expired.`);
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="weblens-audit-${id}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return result;
  }
}
