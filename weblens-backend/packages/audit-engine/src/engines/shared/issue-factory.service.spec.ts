import { IssueFactory } from './issue-factory.service';
import { EngineType, EvidenceType, IssueStatus, Severity } from '../../models/audit-issue.interface';

describe('IssueFactory', () => {
  it('should create issue with explicit score and warning status', () => {
    const issue = IssueFactory.create(
      'performance',
      'PERF-01',
      'High TBT',
      'TBT is too high',
      'medium',
      'warning',
      1,
      'performance',
      'impact',
      [],
      'Fix it',
      50
    );

    expect(issue.score).toBe(50);
    expect(issue.status).toBe('warning');
    expect(issue.ruleId).toBe('PERF-01');
  });

  it('should preserve bool() behavior', () => {
    const passIssue = IssueFactory.bool(
      true,
      'seo',
      'SEO-01',
      'Title OK',
      'Desc',
      'high',
      1,
      'seo',
      'impact',
      'actual',
      'expected',
      'performance-metric',
      'source'
    );
    expect(passIssue.status).toBe('pass');
    expect(passIssue.score).toBe(100);

    const failIssue = IssueFactory.bool(
      false,
      'seo',
      'SEO-01',
      'Title OK',
      'Desc',
      'high',
      1,
      'seo',
      'impact',
      'actual',
      'expected',
      'performance-metric',
      'source'
    );
    expect(failIssue.status).toBe('fail');
    expect(failIssue.score).toBe(0);
  });
});
