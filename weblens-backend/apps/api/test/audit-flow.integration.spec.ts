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
    getAuditResult: jest.fn().mockResolvedValue(null),
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

  it('GET /audits/:id/result - should return perfDetails correctly formatted', async () => {
    const mockedResult = {
      id: 'audit-123',
      url: 'https://example.com',
      status: 'completed',
      perfScore: 90,
      perfDetails: {
        loadTimeMs: 1200,
        coreWebVitals: {
          lcp: 1500,
          cls: 0.05,
          inp: 100,
          fcp: 800,
          ttfb: 300,
          tbt: 50,
          tbtSynthetic: true
        },
        heavyResources: 0,
        budget: []
      },
      performanceIssues: [
        { id: 'PERF-LCP-00', ruleId: 'PERF-LCP-00', status: 'pass' },
        { id: 'PERF-CLS-01', ruleId: 'PERF-CLS-01', status: 'fail' }
      ],
      performanceOpportunities: [
        { id: 'PERF-RES-JS', ruleId: 'PERF-RES-JS', status: 'warning' }
      ],
      referenceLinks: [
        { title: 'web.dev: CLS', url: 'https://web.dev/articles/cls', category: 'performance' }
      ]
    };

    mockRedisService.getAuditResult.mockResolvedValueOnce(mockedResult);

    const response = await request(app.getHttpServer())
      .get('/audits/audit-123/result')
      .expect(200);

    const result = response.body.result;
    expect(result.perfDetails.coreWebVitals.lcp).toBe(1500);
    expect(result.perfScore).toBe(90);
    expect(result.performanceIssues.length).toBeGreaterThan(0);
    expect(result.performanceOpportunities.length).toBeGreaterThan(0);
    expect(result.performanceIssues).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'PERF-RES-JS' })]));
    
    expect(result.referenceLinks.filter((l: any) => l.category === 'performance').length).toBeGreaterThan(0);
  });
});
