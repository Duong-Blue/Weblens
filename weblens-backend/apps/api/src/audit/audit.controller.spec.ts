import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

describe('AuditController', () => {
  let controller: AuditController;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: getQueueToken('audit-queue'),
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {
            getAuditResult: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('getAuditResult', () => {
    it('returns audit.url on success', async () => {
      const mockId = '123';
      const mockResult = { url: 'https://example.com' };
      (redisService.getAuditResult as jest.Mock).mockResolvedValue(mockResult);

      const response = await controller.getAuditResult(mockId);

      expect(response).toEqual({
        audit: { id: mockId, status: 'completed' },
        result: mockResult,
      });
      expect(redisService.getAuditResult).toHaveBeenCalledWith(mockId);
    });

    it('returns status pending_or_not_found if result is null', async () => {
      const mockId = '456';
      (redisService.getAuditResult as jest.Mock).mockResolvedValue(null);

      const response = await controller.getAuditResult(mockId);

      expect(response).toEqual({
        audit: { id: mockId, status: 'pending_or_not_found' },
        result: null,
      });
      expect(redisService.getAuditResult).toHaveBeenCalledWith(mockId);
    });
  });

  describe('exportAuditResult', () => {
    it('throws NotFoundException if result is null', async () => {
      const mockId = '789';
      (redisService.getAuditResult as jest.Mock).mockResolvedValue(null);
      const mockRes = {} as Response;

      await expect(controller.exportAuditResult(mockId, mockRes)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls res.setHeader with Content-Disposition on success', async () => {
      const mockId = 'abc';
      const mockResult = { data: 'test' };
      (redisService.getAuditResult as jest.Mock).mockResolvedValue(mockResult);
      
      const mockRes = {
        setHeader: jest.fn(),
      } as unknown as Response;

      const response = await controller.exportAuditResult(mockId, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="weblens-audit-${mockId}.json"`,
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(response).toEqual(mockResult);
    });
  });
});
