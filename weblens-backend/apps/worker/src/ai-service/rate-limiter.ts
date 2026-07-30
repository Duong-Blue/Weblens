import { Injectable } from '@nestjs/common';

@Injectable()
export class AiRateLimiter {
  private maxTokens = 2;
  private refillRate = 5;
  private windowMs = 60000;
  private tokens: number;
  private lastRefill: number;
  private waiting: Array<() => void> = [];

  constructor() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const timePerToken = this.windowMs / this.refillRate;

    if (elapsedMs >= timePerToken) {
      const tokensToAdd = Math.floor(elapsedMs / timePerToken);
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill += tokensToAdd * timePerToken;

      while (this.waiting.length > 0 && this.tokens > 0) {
        const next = this.waiting.shift();
        if (next) {
          this.tokens -= 1;
          next();
        }
      }
    }
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  releaseToken(): void {
    this.tokens = Math.min(this.maxTokens, this.tokens + 1);

    if (this.waiting.length > 0 && this.tokens > 0) {
      const next = this.waiting.shift();
      if (next) {
        this.tokens -= 1;
        next();
      }
    }
  }
}
