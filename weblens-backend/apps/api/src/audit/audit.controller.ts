import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Throttle } from '@nestjs/throttler';
import { Audit, AuditResult, User } from '@weblens/shared-types';
import { CreateAuditDto } from './dto/create-audit.dto';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

@Controller('audits')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(
    @InjectQueue('audit-queue') private readonly auditQueue: Queue,
    @InjectRepository(Audit) private auditRepository: Repository<Audit>,
    @InjectRepository(AuditResult)
    private auditResultRepository: Repository<AuditResult>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createAudit(
    @Body() body: CreateAuditDto,
    @Req() req: Request,
  ): Promise<{ message: string; audit: Audit }> {
    let formattedUrl = body.url.trim();
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://')
    ) {
      formattedUrl = 'https://' + formattedUrl;
    }

    this.logger.log(`Received audit request for URL: ${formattedUrl}`);

    let userId: string | undefined = undefined;
    const token = (req.cookies as Record<string, string>)?.access_token;
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub: string }>(
          token,
          {
            secret: process.env.JWT_SECRET || 'secret',
          },
        );
        userId = payload.sub;

        if (userId) {
          const userExists = await this.userRepository.findOne({
            where: { id: userId },
          });
          if (!userExists) {
            this.logger.debug(
              `User ID ${userId} from token not found in database, treating as anonymous`,
            );
            userId = undefined;
          }
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        this.logger.debug(`Token invalid, treating as anonymous: ${message}`);
        userId = undefined;
      }
    }

    if (body.anonymous) {
      const generatedId = randomUUID();
      this.logger.log(`Created anonymous audit object with ID: ${generatedId}`);

      const partialAudit = {
        id: generatedId,
        url: formattedUrl,
        userId: undefined,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.auditQueue.add(
        'process-audit',
        {
          auditId: generatedId,
          url: formattedUrl,
          userId: undefined,
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
        audit: partialAudit as unknown as Audit,
      };
    }

    const audit = this.auditRepository.create({
      url: formattedUrl,
      userId: userId,
      status: 'pending',
    });
    const savedAudit = await this.auditRepository.save(audit);
    this.logger.log(`Created audit record in DB with ID: ${savedAudit.id}`);

    await this.auditQueue.add(
      'process-audit',
      {
        auditId: savedAudit.id,
        url: savedAudit.url,
        userId: userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true, // Optional: keep redis clean
        removeOnFail: false, // Keep failed jobs for inspection
      },
    );
    this.logger.log(`Added audit job ${savedAudit.id} to queue`);

    return {
      message: 'Audit job created successfully',
      audit: savedAudit,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMyAudits(
    @Req() req: Request & { user: { sub: string } },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await this.auditRepository.findAndCount({
      where: { userId: req.user.sub },
      order: { createdAt: 'DESC' },
      skip,
      take: limitNum,
    });

    return {
      data: items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id/result')
  async getAuditResult(
    @Param('id') id: string,
  ): Promise<{ audit: Audit; result: AuditResult | null }> {
    const audit = await this.auditRepository.findOne({
      where: { id },
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    const result = await this.auditResultRepository.findOne({
      where: { auditId: id },
    });

    if (!result) {
      return {
        audit,
        result: null,
      };
    }

    return {
      audit,
      result,
    };
  }

  @Get(':id/export')
  async exportAuditResult(@Param('id') id: string) {
    const audit = await this.auditRepository.findOne({
      where: { id },
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    const result = await this.auditResultRepository.findOne({
      where: { auditId: id },
    });

    if (!result) {
      throw new NotFoundException('Audit result not found');
    }

    let parsedAiSummary: unknown = null;
    if (result.aiSummary) {
      try {
        parsedAiSummary = JSON.parse(result.aiSummary) as unknown;
      } catch {
        parsedAiSummary = {
          overview: result.aiSummary,
          strengths: [],
          weaknesses: [],
          recommendations: [],
        };
      }
    }

    return {
      auditId: audit.id,
      url: audit.url,
      date: audit.createdAt,
      scores: {
        perf: result.perfScore,
        seo: result.seoScore,
        acc: result.accScore,
        security: result.securityScore,
      },
      technology: result.techStack,
      aiSummary: parsedAiSummary,
      details: {
        performance: result.perfDetails,
        seo: result.seoDetails,
        accessibility: result.accDetails,
        security: result.securityDetails,
        network: result.networkDetails,
        structure: result.structureDetails,
        jsErrors: result.jsErrorsDetails,
        uiUx: result.uiUxDetails,
      },
    };
  }
}
