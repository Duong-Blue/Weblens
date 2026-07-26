import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditController } from './audit.controller';

import { JwtModule } from '@nestjs/jwt';

import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
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
})
export class AuditModule {}
