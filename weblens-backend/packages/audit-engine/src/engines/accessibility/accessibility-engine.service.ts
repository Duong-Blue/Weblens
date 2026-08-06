import { Injectable } from '@nestjs/common';
import { AxeRunnerService } from './axe-runner.service';
import { WcagMapperService } from './wcag-mapper.service';

@Injectable()
export class AccessibilityEngineService {
  constructor(
    private readonly axeRunnerService: AxeRunnerService,
    private readonly wcagMapperService: WcagMapperService,
  ) {}

  async analyze(page: any): Promise<any> {
    const accessibilityResults = await this.axeRunnerService.runAxeOnPage(page);
    const mappedAccessibilityIssues = await this.wcagMapperService.mapAxeToIssues(accessibilityResults);
    
    return {
      issues: mappedAccessibilityIssues
    };
  }
}
