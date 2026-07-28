import { Injectable, Logger } from '@nestjs/common';
import * as axe from 'axe-core';
import { AxeBuilder } from '@axe-core/playwright';
import { Page } from 'playwright';

@Injectable()
export class AxeRunnerService {
  private readonly logger = new Logger(AxeRunnerService.name);

  /**
   * Run axe-core against a live Playwright page context
   */
  async runAxeOnPage(page: Page): Promise<axe.AxeResults> {
    this.logger.debug('Running axe-core on Playwright page');
    
    try {
      // Create AxeBuilder with the Playwright page.
      // @axe-core/playwright requires popup blockers to be disabled to spawn a blank page for finishRun
      // It also requires us to NOT use legacyMode unless we want to disable cross-origin frame testing.
      const builder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .setLegacyMode(true); // use legacyMode to avoid browser.newContext() which fails here since we don't pass the context properly, we just pass the page, and axe wants to spawn a new page in the context
        
      return await builder.analyze();
    } catch (error) {
      this.logger.error(`Error running axe-core: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * For completeness - if we were to receive results from a page run via Playwright
   * The actual execution would happen in a crawler worker, but we can parse the results here
   */
  processResults(results: axe.AxeResults): axe.AxeResults {
    return results;
  }
}
