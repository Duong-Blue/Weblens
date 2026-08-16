import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, ScoreGauge, KnowledgeLink, StatusPill } from '../primitives';

export const AccessibilitySection: React.FC<{ model: ReportModel }> = ({ model }) => {
  const { issues, improvements, categoryScores } = model;
  
  const a11yIssues = issues.filter(i => i.category === 'accessibility');
  const a11yImps = improvements.find(i => i.area.toLowerCase().includes('accessibility'))?.recommendations || [];

  return (
    <ReportSection title="Accessibility" number={7} pageBreak>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex flex-col items-center justify-center space-y-4 w-full md:w-1/3">
          <ScoreGauge score={categoryScores.accessibility} size={120} strokeWidth={8} />
          <span className="text-sm font-medium text-gray-500">Điểm Trợ năng</span>
        </div>
        <div className="w-full md:w-2/3">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tiêu chuẩn WCAG</h3>
            <p className="text-sm text-gray-600 mb-4">
              Khả năng truy cập web (Accessibility) đảm bảo trang web của bạn có thể sử dụng được bởi tất cả mọi người, kể cả những người khuyết tật.
            </p>
            <KnowledgeLink slug="wcag" title="Tìm hiểu về tiêu chuẩn WCAG" />
        </div>
      </div>

      {a11yIssues.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Các vấn đề Axe phát hiện (Axe Issues)</h3>
           <div className="space-y-4">
              {a11yIssues.map((issue, idx) => (
                <div key={idx} className="bg-white border border-red-100 p-4 rounded-lg shadow-sm">
                   <div className="flex items-start justify-between">
                     <h4 className="font-medium text-gray-900">{issue.title || issue.ruleId}</h4>
                     <StatusPill status={issue.severity === 'critical' || issue.severity === 'high' ? 'Fail' : 'Warning'} />
                   </div>
                   <p className="text-sm text-gray-600 mt-2">{issue.description}</p>
                   {issue.ruleId && <KnowledgeLink slug={issue.ruleId} className="mt-3" title="Tìm hiểu cách khắc phục" />}
                </div>
              ))}
           </div>
        </div>
      )}

      {a11yImps.length > 0 && (
        <div className="mt-8 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
           <h3 className="text-lg font-semibold text-blue-900 mb-4">Khuyến nghị AI</h3>
           <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
             {a11yImps.map((rec, idx) => (
               <li key={idx}>{rec}</li>
             ))}
           </ul>
        </div>
      )}
    </ReportSection>
  );
};
