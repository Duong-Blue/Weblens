import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';
import { AuditLogicService } from '@weblens/audit-engine';
import { AuditProcessor } from './audit-processor';
import { Audit, AuditResult, User } from '@weblens/shared-types';
import { AiServiceService } from './ai-service/ai-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // Point to the root .env file of the monorepo
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'weblens',
      entities: [User, Audit, AuditResult],
      synchronize: false,
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
    TypeOrmModule.forFeature([Audit, AuditResult]),
  ],
  controllers: [AppController],
  providers: [AppService, CrawlerService, AuditLogicService, AuditProcessor, AiServiceService],
})
export class AppModule {}

