import { Injectable, Logger } from '@nestjs/common';
import { HeaderCheckerService } from './header-checker.service';
import { TlsValidatorService } from './tls-validator.service';
import { SecurityMapperService } from './security-mapper.service';
import { MozObservatoryService } from './moz-observatory.service';
import { EngineContext } from '../shared/engine.types';
import { AuditIssue } from '../../models';

export interface SecurityEngineResult {
  score: number;
  issues: AuditIssue[];
  mozillaGrade?: string;
  mozillaScore?: number;
  mozillaTests?: {
    passed: number;
    failed: number;
  };
}

@Injectable()
export class SecurityEngineService {
  private readonly logger = new Logger(SecurityEngineService.name);

  constructor(
    private readonly headerCheckerService: HeaderCheckerService,
    private readonly tlsValidatorService: TlsValidatorService,
    private readonly securityMapperService: SecurityMapperService,
    private readonly mozObservatoryService: MozObservatoryService,
  ) {}

  async analyze(context: EngineContext): Promise<SecurityEngineResult> {
    const headers = context.headers || {};
    const tlsInfo = context.crawlData?.tlsInfo || null;

    const headerResults = this.headerCheckerService.checkSecurityHeaders(headers);
    const tlsResults = this.tlsValidatorService.checkTLS(tlsInfo);

    const allSecurityIssues = [...headerResults, ...tlsResults];
    const securityScoreResult = this.securityMapperService.calculateSecurityScore(allSecurityIssues);

    let mozillaGrade = securityScoreResult.mozillaResult.grade;
    let mozillaScore: number | undefined;
    let mozillaTests: { passed: number; failed: number } | undefined;

    try {
      const hostname = new URL(context.url).hostname;
      const mozResult = await this.mozObservatoryService.analyze(hostname);
      if (mozResult) {
        mozillaGrade = mozResult.grade;
        mozillaScore = mozResult.score;
        mozillaTests = {
          passed: mozResult.testsPassed || mozResult.tests_failed,
          failed: mozResult.testsFailed || mozResult.tests_failed,
        };
      }
    } catch (e) {
      this.logger.warn(`Mozilla Observatory failed for ${context.url}, using fallback grade`);
    }

    return {
      score: securityScoreResult.score,
      issues: allSecurityIssues,
      mozillaGrade,
      mozillaScore,
      mozillaTests,
    };
  }
}
