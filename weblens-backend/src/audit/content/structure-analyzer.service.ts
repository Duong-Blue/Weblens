import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class StructureAnalyzerService {
  /**
   * Analyzes the HTML document structure (headings, lists, tables).
   */
  analyzeStructure(html: string): {
    headings: { level: number; text: string }[];
    hasProperHierarchy: boolean;
    listsCount: number;
    tablesCount: number;
    paragraphCount: number;
  } {
    const $ = cheerio.load(html);
    
    // Analyze headings
    const headings: { level: number; text: string }[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      headings.push({
        level: parseInt((el as any).name.replace('h', ''), 10),
        text: $(el).text().trim(),
      });
    });

    const hasProperHierarchy = this.checkHeadingHierarchy(headings);

    const listsCount = $('ul, ol, dl').length;
    const tablesCount = $('table').length;
    const paragraphCount = $('p').length;

    return {
      headings,
      hasProperHierarchy,
      listsCount,
      tablesCount,
      paragraphCount
    };
  }

  /**
   * Checks if headings follow a logical hierarchy (e.g., h1 -> h2 -> h3, no skipping levels downward like h1 -> h3).
   * Multiple h1s are generally discouraged but not strictly a hierarchy error in modern HTML5, 
   * but skipping a level (H1 to H3) is a structural issue.
   */
  private checkHeadingHierarchy(headings: { level: number; text: string }[]): boolean {
    if (headings.length === 0) return true; // No headings = no hierarchy errors, but maybe poor structure overall
    
    // Check if the first heading is an H1 (best practice)
    // if (headings[0].level !== 1) return false;

    let previousLevel = headings[0].level;

    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      
      // If we jump down more than one level (e.g., H2 -> H4), it's bad hierarchy
      if (currentLevel - previousLevel > 1) {
        return false;
      }
      
      previousLevel = currentLevel;
    }

    return true;
  }
}
