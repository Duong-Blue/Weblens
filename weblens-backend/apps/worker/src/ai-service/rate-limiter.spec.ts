import { AiRateLimiter } from './rate-limiter';

describe('AiRateLimiter', () => {
  let rateLimiter: AiRateLimiter;

  beforeEach(() => {
    rateLimiter = new AiRateLimiter();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waitForToken() resolves immediately when tokens available', async () => {
    const promise = rateLimiter.waitForToken();
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    // Let the event loop run once
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(resolved).toBe(true);
  });

  it('3 concurrent calls — 3rd is delayed until releaseToken()', async () => {
    const promises: Promise<void>[] = [];
    const resolved: boolean[] = [false, false, false];

    for (let i = 0; i < 3; i++) {
      const p = rateLimiter.waitForToken();
      p.then(() => {
        resolved[i] = true;
      });
      promises.push(p);
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Max tokens is 2, so the first two should resolve, the third should wait
    expect(resolved[0]).toBe(true);
    expect(resolved[1]).toBe(true);
    expect(resolved[2]).toBe(false);

    // Release a token
    rateLimiter.releaseToken();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Now the third should resolve
    expect(resolved[2]).toBe(true);
  });

  it('Tokens refill over time', async () => {
    const originalDateNow = Date.now;
    let mockTime = 1000000;
    jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    rateLimiter = new AiRateLimiter();

    rateLimiter.waitForToken();
    rateLimiter.waitForToken();

    mockTime += 12000;

    const p3 = rateLimiter.waitForToken();
    let resolved = false;
    p3.then(() => {
      resolved = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(resolved).toBe(true);

    jest.restoreAllMocks();
  });
});
