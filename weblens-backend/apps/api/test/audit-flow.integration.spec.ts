import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, User } from '@weblens/shared-types';
import cookieParser from 'cookie-parser'; // Note: Main app uses cookie-parser, and auth strategy looks for cookies.
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('Audit Flow (e2e)', () => {
  let app: INestApplication;
  let auditRepository: Repository<Audit>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  
  // Create a mock for the BullMQ queue
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken('audit-queue'))
      .useValue(mockQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    auditRepository = moduleFixture.get<Repository<Audit>>(getRepositoryToken(Audit));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    // Clean up
    await auditRepository.query('DELETE FROM audit_result');
    await auditRepository.query('DELETE FROM audit');
    await userRepository.query('DELETE FROM user');
    await app.close();
  });

  beforeEach(async () => {
    // Clear mocks and db before each test
    jest.clearAllMocks();
    await auditRepository.query('DELETE FROM audit_result');
    await auditRepository.query('DELETE FROM audit');
    await userRepository.query('DELETE FROM user');
  });

  it('POST /audits - should create an audit and enqueue a job', async () => {
    // 1. Create a user
    const password = await bcrypt.hash('testpass123', 10);
    const user = await userRepository.save({
      email: 'test@example.com',
      password,
    });

    // 2. Generate a valid JWT token
    const token = await jwtService.signAsync({ sub: user.id, email: user.email });

    const targetUrl = 'example.com';
    const expectedUrl = 'https://example.com';

    // 3. Make request
    const response = await request(app.getHttpServer())
      .post('/audits')
      .set('Cookie', [`access_token=${token}`])
      .send({ url: targetUrl })
      .expect(201); // NestJS default for POST is 201

    // 4. Assert response body
    expect(response.body).toHaveProperty('message', 'Audit job created successfully');
    expect(response.body).toHaveProperty('audit');
    expect(response.body.audit).toHaveProperty('id');
    expect(response.body.audit).toHaveProperty('url', expectedUrl);
    expect(response.body.audit).toHaveProperty('status', 'pending');
    expect(response.body.audit).toHaveProperty('userId', null);

    const createdAuditId = response.body.audit.id;

    // 5. Assert DB
    const dbAudit = await auditRepository.findOne({ where: { id: createdAuditId } });
    expect(dbAudit).toBeDefined();
    expect(dbAudit?.url).toBe(expectedUrl);
    expect(dbAudit?.status).toBe('pending');
    expect(dbAudit?.userId).toBeNull();

    // 6. Assert Queue
    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith('process-audit', {
      auditId: createdAuditId,
      url: expectedUrl,
      userId: null,
    });
  });
  
  it('POST /audits - should create an audit and enqueue a job without auth', async () => {
    const targetUrl = 'https://anotherexample.com';

    // Make request without cookie
    const response = await request(app.getHttpServer())
      .post('/audits')
      .send({ url: targetUrl })
      .expect(201); 

    expect(response.body).toHaveProperty('message', 'Audit job created successfully');
    expect(response.body.audit).toHaveProperty('id');
    expect(response.body.audit).toHaveProperty('userId', null);

    const createdAuditId = response.body.audit.id;

    const dbAudit = await auditRepository.findOne({ where: { id: createdAuditId } });
    expect(dbAudit).toBeDefined();
    expect(dbAudit?.userId).toBeNull();

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith('process-audit', {
      auditId: createdAuditId,
      url: targetUrl,
      userId: null,
    });
  });
});
