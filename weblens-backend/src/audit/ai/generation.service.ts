import { Injectable, Logger } from '@nestjs/common';
import { EnhancedIssue, ContextualFinding } from './enhancement.service';
import { TechStack } from '@weblens/audit-engine';

export interface ScreenshotCollection {
  desktop: string;
  mobile: string;
  tablet?: string;
  darkMode?: string;
}

export interface AIGenerationInput {
  url: string;
  overallScore: number;
  breakdown: Record<string, number>;
  enhancedIssues: EnhancedIssue[];
  contextualFindings: ContextualFinding[];
  techStack: TechStack;
  screenshots: ScreenshotCollection;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'seo' | 'accessibility' | 'security' | 'content';
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'minutes' | 'hours' | 'days';
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement: string;
  steps: string[];
  codeExample?: string;
  relatedIssues: string[];
  references: string[];
}

export interface AIGenerationOutput {
  executiveSummary: string;
  scoreInterpretation: string;
  strengths: Array<{
    area: string;
    description: string;
    score: number;
  }>;
  weaknesses: Array<{
    area: string;
    description: string;
    impact: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedFixTime: string;
  }>;
  recommendations: AIRecommendation[];
  competitiveContext?: string;
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  async generate(input: AIGenerationInput): Promise<AIGenerationOutput> {
    this.logger.log(`Generating report for ${input.url} with score ${input.overallScore}`);
    
    // Mock implementation based on PHASE_09_AI_WORKFLOW.md
    const prompt = `
You are a Website Audit Report Writer. Generate a professional executive summary.

Given:
- URL: ${input.url}
- Overall Score: ${input.overallScore}/100
- Category Breakdown: ${JSON.stringify(input.breakdown)}
- Critical Issues: ${input.enhancedIssues.filter(i => i.issue.issue.severity === 'critical').length}
- Technology Stack: ${JSON.stringify(input.techStack)}

Write a concise executive summary (2-3 paragraphs) that:
1. States the overall assessment
2. Highlights key strengths
3. Identifies critical problems
4. Gives a clear verdict

Then list top 5 recommendations with estimated impact.
`;

    this.logger.debug(`Generated prompt: ${prompt.substring(0, 100)}...`);

    // Mock output
    return {
      executiveSummary: `This is an executive summary for ${input.url}. The overall score is ${input.overallScore}/100, which indicates a good but improvable state.`,
      scoreInterpretation: `Your site scores ${input.overallScore}/100, placing it in the average tier.`,
      strengths: [
        {
          area: 'Performance',
          description: 'Initial server response time is good.',
          score: input.breakdown['performance'] || 80
        }
      ],
      weaknesses: input.enhancedIssues.map(ei => ({
        area: ei.issue.issue.category,
        description: ei.detailedExplanation,
        impact: ei.businessRisk,
        priority: ei.issue.issue.severity,
        estimatedFixTime: '2 hours'
      })).slice(0, 3),
      recommendations: input.enhancedIssues.map((ei, idx) => ({
        id: `REC-${idx}`,
        title: `Fix ${ei.issue.issue.title}`,
        description: ei.fixSteps.join(' '),
        category: ei.issue.issue.category as any,
        priority: ei.issue.issue.severity,
        effort: 'hours' as "hours" | "minutes" | "days",
        impact: 'medium' as "high" | "medium" | "low",
        estimatedImprovement: 'Noticeable improvement',
        steps: ei.fixSteps,
        relatedIssues: [ei.issue.issue.id],
        references: []
      })).slice(0, 5),
      actionPlan: {
        immediate: input.enhancedIssues.filter(ei => ei.issue.fixUrgency === 'immediate').map(ei => ei.issue.issue.id),
        shortTerm: [],
        mediumTerm: [],
        longTerm: []
      }
    };
  }
}
