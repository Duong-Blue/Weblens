import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MozObservatoryService {
  private readonly logger = new Logger(MozObservatoryService.name);
  private readonly baseUrl = 'https://observatory-api.md.mozilla.org/api/v2';

  async analyze(host: string): Promise<any> {
    const postUrl = `${this.baseUrl}/analyze?host=${encodeURIComponent(host)}`;
    let retries = 3;

    while (retries > 0) {
      try {
        // Step 1: POST to initiate scan
        const postRes = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'WebLens-Worker/1.0',
          },
          body: 'hidden=true'
        });

        if (postRes.status === 429) {
          this.logger.warn(`Rate limited (429) by Mozilla Observatory. Retries left: ${retries - 1}`);
          retries--;
          await this.delay(10000);
          continue;
        }

        if (!postRes.ok) {
          this.logger.error(`Failed to initiate scan for ${host}. Status: ${postRes.status}`);
          return null;
        }

        const postData = await postRes.json();
        const scanId = postData.id;

        if (!scanId) {
          this.logger.error(`No scan ID returned for ${host}`);
          return null;
        }

        const getUrl = `${this.baseUrl}/analyze/${scanId}`;

        // Step 2: Poll GET results every 5s (max 30s)
        const maxPolls = 6;
        for (let i = 0; i < maxPolls; i++) {
          await this.delay(5000);

          const getRes = await fetch(getUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'WebLens-Worker/1.0' },
          });

          if (getRes.status === 429) {
            this.logger.warn('Rate limited (429) during polling. Waiting 10s...');
            await this.delay(10000);
            continue;
          }

          if (getRes.ok) {
            const data = await getRes.json();
            if (data.state === 'FINISHED' || data.grade) {
              return data;
            }
            if (data.state === 'ABORTED' || data.state === 'FAILED') {
              this.logger.error(`Scan aborted/failed. State: ${data.state}`);
              return null;
            }
            this.logger.debug(`Scan for ${host} still in progress (state: ${data.state})...`);
          } else {
            this.logger.error(`GET scan failed. Status: ${getRes.status}`);
            return null;
          }
        }

        this.logger.warn(`Mozilla Observatory scan timeout for ${host} after 30s.`);
        return null;

      } catch (error) {
        this.logger.warn(`Mozilla Observatory unavailable (${error instanceof Error ? error.message : error}), using fallback grade`);
        return null; // Network error → fallback về fake grade
      }
    }

    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
