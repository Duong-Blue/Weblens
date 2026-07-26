import { Injectable } from '@nestjs/common';
import { ReadabilityService } from './readability.service';
import { StructureAnalyzerService } from './structure-analyzer.service';

export interface ContentQualityResult {
  score: number; // 0-100
  readability: {
    fleschScore: number;
    readingTime: number; // minutes
    wordCount: number;
  };
  structure: {
    hasProperHierarchy: boolean;
    listsCount: number;
    tablesCount: number;
    paragraphCount: number;
  };
  issues: string[];
}

@Injectable()
export class ContentMapperService {
  constructor(
    private readonly readabilityService: ReadabilityService,
    private readonly structureAnalyzer: StructureAnalyzerService,
  ) {}

  public evaluateContentQuality(html: string): ContentQualityResult {
    const readability = this.readabilityService.calculateFleschScore(html);
    const structure = this.structureAnalyzer.analyzeStructure(html);

    let score = 100;
    const issues: string[] = [];

    // Evaluate Readability
    // 60-70 is standard, below 50 is difficult, above 80 is easy
    if (readability.score < 50) {
      score -= 15;
      issues.push(`Readability score is low (${readability.score}). Content might be too difficult to read.`);
    } else if (readability.score < 60) {
      score -= 5;
      issues.push(`Readability is slightly below standard (${readability.score}). Consider simplifying sentences.`);
    }

    if (readability.wordCount < 100) {
      score -= 10;
      issues.push(`Content is very thin (${readability.wordCount} words).`);
    }

    // Evaluate Structure
    if (!structure.hasProperHierarchy) {
      score -= 15;
      issues.push(`Heading hierarchy is incorrect (e.g., skipping from H1 to H3).`);
    }

    if (structure.headings.length === 0) {
      score -= 10;
      issues.push(`No headings found. Use headings to structure your content.`);
    }

    if (structure.paragraphCount === 0 && readability.wordCount > 50) {
      score -= 10;
      issues.push(`Large amount of text without paragraph tags.`);
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      readability: {
        fleschScore: readability.score,
        readingTime: readability.readingTime,
        wordCount: readability.wordCount,
      },
      structure: {
        hasProperHierarchy: structure.hasProperHierarchy,
        listsCount: structure.listsCount,
        tablesCount: structure.tablesCount,
        paragraphCount: structure.paragraphCount,
      },
      issues,
    };
  }
}
