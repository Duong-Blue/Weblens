import * as React from 'react';
import { AuditResult } from '../../../types/audit';
import { buildReportModel } from './reportModel';

import {
  CoverSection,
  SummarySection,
  WebsiteInfoSection,
  PerformanceSection,
  SeoSection,
  AccessibilitySection,
  SecuritySection,
  TechnologySection,
  IssueListSection,
  PriorityPlanSection,
  ConclusionSection,
  AppendixSection,
} from './sections';

interface AuditReportProps {
  result: AuditResult;
  url: string;
}

export function AuditReport({ result, url }: AuditReportProps) {
  const data = React.useMemo(() => {
    return buildReportModel(result, { auditedUrl: url });
  }, [result, url]);

  return (
    <div className="bg-zinc-50 min-h-screen text-gray-900 selection:bg-blue-100 selection:text-blue-900 pb-20">
      <div className="max-w-[210mm] mx-auto bg-white sm:shadow-lg sm:my-8 overflow-hidden print:m-0 print:shadow-none relative">
        <CoverSection report={data} url={url} />
        
        <div className="px-6 py-12 sm:px-12 md:px-16 space-y-16 print:p-0 print:space-y-8">
          <SummarySection report={data} />
          <WebsiteInfoSection report={data} url={url} auditId={result.id || ''} />
          <PerformanceSection model={data} />
          <SeoSection model={data} />
          <AccessibilitySection model={data} />
          <SecuritySection model={data} />
          <TechnologySection data={data} />
          <IssueListSection data={data} />
          <PriorityPlanSection data={data} />
          <ConclusionSection data={data} />
          <AppendixSection data={data} />
        </div>
      </div>
    </div>
  );
}
