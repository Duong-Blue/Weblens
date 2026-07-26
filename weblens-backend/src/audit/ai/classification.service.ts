import { Injectable, Logger } from '@nestjs/common';

export interface AuditIssue {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  scoreImpact: number;
}

export interface PrioritizedIssue {
  issue: AuditIssue;
  aiPriority: number;
  businessImpact: string;
  fixUrgency: 'immediate' | 'this-sprint' | 'next-sprint' | 'backlog';
  estimatedImpact: {
    metric: string;
    improvement: string;
  };
}

export interface AIClassificationInput {
  issues: AuditIssue[];
  url: string;
  pageType: 'homepage' | 'article' | 'product' | 'category' | 'landing' | 'other';
  businessType?: 'ecommerce' | 'saas' | 'blog' | 'corporate' | 'media';
}

export interface AIClassificationOutput {
  prioritizedIssues: PrioritizedIssue[];
  suppressedIssues: Array<{
    issueId: string;
    reason: string;
  }>;
  top3Priorities?: string[];
}

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  // In a real app, this would use a real LLM client
  async classify(input: AIClassificationInput): Promise<AIClassificationOutput> {
    this.logger.log(`Classifying ${input.issues.length} issues for ${input.url}`);
    
    // Mock implementation based on PHASE_09_AI_WORKFLOW.md
    const prompt = `
You are a Senior Web Audit Analyst. Your job is to prioritize website audit issues.

Given the following information:
- URL: ${input.url}
- Page Type: ${input.pageType}
- Business Type: ${input.businessType || 'unknown'}
- Issues: ${JSON.stringify(input.issues)}

Please:
1. Rank issues by real-world business impact (not just severity)
2. Identify false positives (if any)
3. Group related issues
4. Suggest which 3 issues to fix FIRST

Output format (JSON):
{
  "prioritizedIssues": [{ "issueId": "PERF-001", "aiPriority": 92, "businessImpact": "...", "fixUrgency": "immediate" }],
  "suppressedIssues": [{ "issueId": "...", "reason": "..." }],
  "top3Priorities": ["...", "...", "..."]
}
`;

    this.logger.debug(`Generated prompt: ${prompt.substring(0, 100)}...`);

    // For now, return a mock response that matches the expected interface
    const prioritizedIssues: PrioritizedIssue[] = input.issues.map((issue, index) => ({
      issue,
      aiPriority: 100 - index * 5, // Mock priority
      businessImpact: `Fixing this will improve user experience for ${input.businessType || 'users'}.`,
      fixUrgency: index === 0 ? 'immediate' : 'this-sprint',
      estimatedImpact: {
        metric: issue.category,
        improvement: `Significant improvement in ${issue.category}`,
      },
    }));

    return {
      prioritizedIssues,
      suppressedIssues: [],
      top3Priorities: prioritizedIssues.slice(0, 3).map(p => p.issue.id),
    };
  }
}
