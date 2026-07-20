import { Injectable } from '@nestjs/common';
import { SIGNATURES } from './signatures';

export interface DetectionResult {
  frameworks: string[];
  cms: string[];
  hosting: string[];
  analytics: string[];
}

export type SignatureCategory = 'framework' | 'cms' | 'hosting' | 'analytics';

export interface TechSignature {
  /** Human-readable name of the technology (e.g. "React", "Google Analytics") */
  name: string;
  /** Category bucket the detection result is sorted into */
  category: SignatureCategory;
  /** Returns true if the given HTML + headers indicate this technology is present */
  test(html: string, headers: Record<string, string>): boolean;
}

/**
 * Signature-based technology detector.
 *
 * Scans HTML content and HTTP response headers against a set of curated
 * regex/string patterns to identify which frameworks, CMSs, hosting
 * platforms, and analytics tools a website is using. Signatures are
 * maintained in the separate `signatures.ts` file and imported here.
 *
 * Usage:
 * ```ts
 * const detector = new TechDetectorService();
 * const result = detector.detect(html, headers);
 * // { frameworks: ['React', 'Next.js'], cms: ['Shopify'], hosting: ['Vercel'], analytics: ['GA'] }
 * ```
 */
@Injectable()
export class TechDetectorService {
  private readonly signatures: TechSignature[];

  constructor() {
    this.signatures = SIGNATURES;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Run all registered signatures against the page HTML and response headers.
   *
   * @param html    The full raw HTML of the crawled page.
   * @param headers HTTP response headers (lowercased keys recommended).
   * @returns       Grouped list of detected technologies.
   */
  detect(html: string, headers: Record<string, string> = {}): DetectionResult {
    const frameworks: string[] = [];
    const cms: string[] = [];
    const hosting: string[] = [];
    const analytics: string[] = [];

    for (const sig of this.signatures) {
      try {
        if (sig.test(html, headers)) {
          switch (sig.category) {
            case 'framework':
              frameworks.push(sig.name);
              break;
            case 'cms':
              cms.push(sig.name);
              break;
            case 'hosting':
              hosting.push(sig.name);
              break;
            case 'analytics':
              analytics.push(sig.name);
              break;
          }
        }
      } catch {
        // Swallow individual signature failures so one bad pattern never
        // prevents the rest of the detection from running.
      }
    }

    return { frameworks, cms, hosting, analytics };
  }
}
