import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { AuditIssue } from '../types/audit.types';

@Injectable()
export class HtmlCheckerService {
  checkHTMLStructure(crawlData: any): AuditIssue[] {
    const issues: AuditIssue[] = [];
    
    // In a real application, crawlData should have htmlContent typed correctly.
    // For now we assume crawlData contains htmlContent as string.
    const html = crawlData.htmlContent || '';
    const $ = cheerio.load(html);

    // Helper for creating boolean issues
    const createBoolIssue = (
      id: string,
      ruleId: string,
      severity: 'critical' | 'high' | 'medium' | 'low',
      weight: number,
      passed: boolean,
      title: string,
      impact: string,
      recommendation: string
    ): AuditIssue => ({
      id: `HTML-${id}-${Date.now()}`,
      ruleId,
      engine: 'HTML_CSS',
      severity,
      status: passed ? 'pass' : 'fail',
      score: passed ? 1 : 0,
      weight,
      title,
      description: title,
      impact,
      recommendation,
      category: 'HTML Structure',
    });

    // HTML-001: Doctype
    const hasDoctype = /<!doctype\s+html>/i.test(html);
    issues.push(
      createBoolIssue(
        '001',
        'doctype-present',
        'high',
        7,
        hasDoctype,
        'HTML5 doctype is properly declared',
        'Missing <!DOCTYPE html> declaration triggers quirks mode in browsers',
        'Add <!DOCTYPE html> as the very first line of the document'
      )
    );

    // HTML-002: Lang attribute
    const lang = $('html').attr('lang');
    issues.push(
      createBoolIssue(
        '002',
        'lang-attr',
        'high',
        7,
        !!lang,
        `Language attribute found: ${lang || '(missing)'}`,
        'Missing lang attribute affects accessibility (screen readers) and SEO',
        'Add lang="[language-code]" to the <html> element'
      )
    );

    // HTML-003: Charset
    const charset = $('meta[charset]').attr('charset');
    const isUtf8 = charset?.toLowerCase() === 'utf-8';
    issues.push(
      createBoolIssue(
        '003',
        'charset-utf8',
        'high',
        7,
        isUtf8,
        isUtf8 ? 'Charset is UTF-8' : `Charset: ${charset || 'missing'}`,
        'Missing or incorrect charset can cause rendering issues with special characters',
        'Add <meta charset="UTF-8"> as the first element in <head>'
      )
    );

    // HTML-005: Title
    const title = $('title').text();
    issues.push(
      createBoolIssue(
        '005',
        'title-element',
        'critical',
        10,
        title.length > 0,
        'Title element found in head',
        'Every page must have a <title> element in the <head> section',
        'Add a descriptive <title> tag to the <head>'
      )
    );

    // HTML-015: No obsolete tags
    const obsoleteTags = ['center', 'font', 'blink', 'marquee', 'strike', 'tt', 'big'];
    const foundObsolete = obsoleteTags.filter((tag) => $(tag).length > 0);
    issues.push(
      createBoolIssue(
        '015',
        'no-obsolete-tags',
        'medium',
        4,
        foundObsolete.length === 0,
        foundObsolete.length === 0
          ? 'No obsolete HTML tags found'
          : `Found obsolete tags: ${foundObsolete.join(', ')}`,
        'Obsolete tags may not render correctly in modern browsers',
        `Replace ${foundObsolete.join(', ')} with modern CSS alternatives`
      )
    );

    // HTML-016: Semantic elements
    const semanticCount = ['main', 'nav', 'article', 'section', 'aside', 'header', 'footer'].reduce(
      (acc, tag) => acc + $(tag).length,
      0
    );
    issues.push(
      createBoolIssue(
        '016',
        'semantic-elements',
        'medium',
        4,
        semanticCount >= 3,
        `Found ${semanticCount} semantic elements (main, nav, article, section, etc.)`,
        'Semantic HTML5 elements improve accessibility and SEO',
        'Use semantic elements like <main>, <nav>, <article>, <section> instead of <div>'
      )
    );

    // HTML-018: Duplicate IDs
    const ids: Record<string, number> = {};
    $('[id]').each((_, el) => {
      const id = $(el).attr('id');
      if (id) ids[id] = (ids[id] || 0) + 1;
    });
    const duplicateIds = Object.entries(ids)
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
    issues.push(
      createBoolIssue(
        '018',
        'unique-id',
        'medium',
        4,
        duplicateIds.length === 0,
        duplicateIds.length === 0
          ? 'All IDs are unique'
          : `Duplicate IDs found: ${duplicateIds.join(', ')}`,
        'Duplicate IDs cause JavaScript querySelector issues and accessibility problems',
        'Ensure every id attribute is unique within the document'
      )
    );

    return issues;
  }
}
