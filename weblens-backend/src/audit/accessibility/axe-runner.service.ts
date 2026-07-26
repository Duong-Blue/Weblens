import { Injectable, Logger } from '@nestjs/common';
import * as axe from 'axe-core';
import { JSDOM } from 'jsdom';

@Injectable()
export class AxeRunnerService {
  private readonly logger = new Logger(AxeRunnerService.name);

  /**
   * Run axe-core against raw HTML string
   * This is used when we don't have a live page context (e.g. offline analysis)
   */
  async runAxeOnHtml(html: string): Promise<axe.AxeResults> {
    this.logger.debug('Running axe-core on HTML string');
    
    try {
      const dom = new JSDOM(html);
      
      const oldWindow = global.window;
      const oldDocument = global.document;
      
      global.window = dom.window as any;
      global.document = dom.window.document as any;

      try {
        const results = await axe.run(dom.window.document as any, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
          },
          resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
        });
        
        return results;
      } finally {
        global.window = oldWindow;
        global.document = oldDocument;
      }
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
