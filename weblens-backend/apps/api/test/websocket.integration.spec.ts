import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppGateway } from '../src/websocket/app.gateway';
import { QueueEventsListener } from '../src/websocket/queue-events.listener';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Audit } from '@weblens/shared-types';
import { QueueEvents } from 'bullmq';

jest.mock('bullmq', () => ({
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

describe('WebSocket Integration (e2e)', () => {
  let app: INestApplication;
  let appGateway: AppGateway;
  let queueEventsListener: QueueEventsListener;
  let mockQueueEventsOn: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        AppGateway,
        QueueEventsListener,
        {
          provide: getRepositoryToken(Audit),
          useValue: {},
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    appGateway = moduleFixture.get<AppGateway>(AppGateway);
    queueEventsListener =
      moduleFixture.get<QueueEventsListener>(QueueEventsListener);

    await app.init();

    if (!appGateway.server) {
      appGateway.server = { emit: jest.fn() } as any;
    } else {
      appGateway.server.emit = jest.fn();
    }

    const QueueEventsMock = (QueueEvents as jest.Mock).mock.results[0].value;
    mockQueueEventsOn = QueueEventsMock.on;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should broadcast progress events when QueueEvents emits progress', async () => {
    const progressHandler = mockQueueEventsOn.mock.calls.find(
      (call) => call[0] === 'progress',
    )?.[1];

    expect(progressHandler).toBeDefined();

    const mockProgressData = {
      jobId: 'job-123',
      data: {
        auditId: 'audit-456',
        step: 'Analyzing SEO',
        progress: 50,
      },
    };

    await progressHandler(mockProgressData);

    expect(appGateway.server.emit).toHaveBeenCalledWith(
      'audit-progress-audit-456',
      mockProgressData.data,
    );
    expect(appGateway.server.emit).toHaveBeenCalledWith(
      'audit-progress',
      mockProgressData.data,
    );
  });

  it('should parse stringified progress data before emitting', async () => {
    const progressHandler = mockQueueEventsOn.mock.calls.find(
      (call) => call[0] === 'progress',
    )?.[1];

    const mockProgressData = {
      jobId: 'job-123',
      data: JSON.stringify({
        auditId: 'audit-789',
        step: 'Analyzing Performance',
        progress: 75,
      }),
    };

    await progressHandler(mockProgressData);

    const expectedParsedData = JSON.parse(mockProgressData.data as string);

    expect(appGateway.server.emit).toHaveBeenCalledWith(
      'audit-progress-audit-789',
      expectedParsedData,
    );
    expect(appGateway.server.emit).toHaveBeenCalledWith(
      'audit-progress',
      expectedParsedData,
    );
  });
});
