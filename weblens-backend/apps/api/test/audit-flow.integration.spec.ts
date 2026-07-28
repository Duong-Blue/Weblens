import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getQueueToken } from '@nestjs/bullmq';
import { RedisService } from '../src/redis/redis.service';
import { Queue } from 'bullmq';

describe('Audit Flow (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisService;
  
  const mockQueue = Object.create(Queue.prototype);
  Object.defineProperty(mockQueue, 'name', { value: 'audit-queue', writable: true });
  Object.defineProperty(mockQueue, 'opts', { value: {}, writable: true });
  Object.defineProperty(mockQueue, 'client', { 
    get: () => Promise.resolve({
      opts: { connectionName: 'audit-queue' },
    }), 
  });
  mockQueue.waitUntilReady = jest.fn().mockResolvedValue(true);
  mockQueue.close = jest.fn().mockResolvedValue(true);
  mockQueue.add = jest.fn().mockResolvedValue({ id: 'mock-job-id' });
  mockQueue.getJobLogs = jest.fn().mockResolvedValue({ logs: [], count: 0 });

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    quit: jest.fn(),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
    onModuleDestroy: jest.fn(),
    onModuleInit: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken('audit-queue'))
      .useValue(mockQueue)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    redisService = moduleFixture.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('POST /audits - should create an audit and enqueue a job', async () => {
    const targetUrl = 'example.com';
    const expectedUrl = 'https://example.com';

    const response = await request(app.getHttpServer())
      .post('/audits')
      .send({ url: targetUrl })
      .expect(201); 

    expect(response.body).toHaveProperty('message', 'Anonymous audit job created successfully');
    expect(response.body).toHaveProperty('audit');
    expect(response.body.audit).toHaveProperty('id');
    expect(response.body.audit).toHaveProperty('url', expectedUrl);
    expect(response.body.audit).toHaveProperty('status', 'pending');

    const createdAuditId = response.body.audit.id;

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith('process-audit', {
      auditId: createdAuditId,
      url: expectedUrl,
      anonymous: true,
    }, expect.any(Object));
  });
});
