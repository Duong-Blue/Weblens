import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Audit, AuditResult, User } from '@weblens/shared-types';
import { AuditController } from './audit.controller';

import { JwtModule } from '@nestjs/jwt';

import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audit, AuditResult, User]),
    BullModule.registerQueue({
      name: 'audit-queue',
    }),
    BullBoardModule.forFeature({
      name: 'audit-queue',
      adapter: BullMQAdapter,
    }),
    JwtModule.register({}),
  ],
  controllers: [AuditController],
  exports: [TypeOrmModule],
})
export class AuditModule {}
