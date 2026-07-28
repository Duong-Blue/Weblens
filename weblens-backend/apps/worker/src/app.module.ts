import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';
import { AuditLogicService } from '@weblens/audit-engine';
import { AuditProcessor } from './audit-processor';
import { AiServiceService } from './ai-service/ai-service.service';
import { AxeRunnerService } from '../../../src/audit/accessibility/axe-runner.service';
import { WcagMapperService } from '../../../src/audit/accessibility/wcag-mapper.service';
import { HeaderCheckerService } from '../../../src/audit/security/header-checker.service';
import { TlsValidatorService } from '../../../src/audit/security/tls-validator.service';
import { SecurityMapperService } from '../../../src/audit/security/security-mapper.service';
import { HtmlCheckerService } from '../../../src/audit/html-css/html-checker.service';
import { CssCheckerService } from '../../../src/audit/html-css/css-checker.service';
import { HtmlCssMapperService } from '../../../src/audit/html-css/html-css-mapper.service';
import { TechDetectorService } from '../../../src/audit/technology/tech-detector.service';
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


