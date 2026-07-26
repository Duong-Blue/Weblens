import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class ReadabilityService {
  /**
   * Calculates the Flesch Reading Ease score for the given HTML content.
   * Formula: 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
   */
  calculateFleschScore(html: string): {
    score: number;
    wordCount: number;
    sentenceCount: number;
    readingTime: number; // in minutes
  } {
    const text = this.extractText(html);
    
    if (!text || text.trim().length === 0) {
      return { score: 0, wordCount: 0, sentenceCount: 0, readingTime: 0 };
    }

    const words = this.getWords(text);
    const wordCount = words.length;
    
    if (wordCount === 0) {
      return { score: 0, wordCount: 0, sentenceCount: 0, readingTime: 0 };
    }

    const sentences = this.getSentences(text);
    const sentenceCount = sentences.length > 0 ? sentences.length : 1;

    const syllableCount = words.reduce((count, word) => count + this.countSyllables(word), 0);

    // Flesch Reading Ease formula
    let score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
    
    // Clamp score between 0 and 100 for normalization
    score = Math.max(0, Math.min(100, score));
    
    // Average reading speed is ~200-250 words per minute. Using 225.
    const readingTime = Math.ceil(wordCount / 225);

    return {
      score: Math.round(score * 10) / 10,
      wordCount,
      sentenceCount,
      readingTime
    };
  }

  private extractText(html: string): string {
    const $ = cheerio.load(html);
    // Remove scripts and styles
    $('script, style, noscript').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  }

  private getWords(text: string): string[] {
    // Basic word extraction, ignoring punctuation
    const words = text.match(/\b[A-Za-z0-9]+\b/g);
    return words || [];
  }

  private getSentences(text: string): string[] {
    // Split by ., !, or ? followed by space or end of string
    const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g);
    // If no explicit punctuation but there is text, treat as one sentence
    if (!sentences && text.trim().length > 0) {
      return [text];
    }
    return sentences || [];
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }
}
