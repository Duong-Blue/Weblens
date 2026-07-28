import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';
import { 
  AuditLogicService, 
  AxeRunnerService, 
  WcagMapperService, 
  HeaderCheckerService, 
  TlsValidatorService, 
  SecurityMapperService, 
  HtmlCheckerService, 
  CssCheckerService, 
  HtmlCssMapperService 
} from '@weblens/audit-engine';
import { AuditProcessor } from './audit-processor';
import { AiServiceService } from './ai-service/ai-service.service';
import { TechDetectorService } from '@weblens/tech-detector';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Point to the root .env file of the monorepo
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'audit-queue',
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CrawlerService,
    AuditLogicService,
    AuditProcessor,
    AiServiceService,
    AxeRunnerService,
    WcagMapperService,
    HeaderCheckerService,
    TlsValidatorService,
    SecurityMapperService,
    HtmlCheckerService,
    CssCheckerService,
    HtmlCssMapperService,
    TechDetectorService
  ],
})
export class AppModule {}


