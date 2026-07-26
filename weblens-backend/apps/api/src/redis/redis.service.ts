import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AuditResult } from '@weblens/shared-types';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err}`);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }

  get client(): Redis {
    return this.redisClient;
  }

  async setAuditResult(auditId: string, result: AuditResult, ttlInSeconds = 1800): Promise<void> {
    const key = `audit:result:${auditId}`;
    await this.redisClient.set(key, JSON.stringify(result), 'EX', ttlInSeconds);
  }

  async getAuditResult(auditId: string): Promise<AuditResult | null> {
    const key = `audit:result:${auditId}`;
    const data = await this.redisClient.get(key);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as AuditResult;
    } catch (e) {
      this.logger.error(`Failed to parse audit result for ${auditId}: ${e}`);
      return null;
    }
  }
}
