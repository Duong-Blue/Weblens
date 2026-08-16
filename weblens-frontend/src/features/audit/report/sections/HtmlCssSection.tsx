import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, ScoreGauge, KnowledgeLink, StatusPill } from '../primitives';

export const HtmlCssSection: React.FC<{ model: ReportModel }> = ({ model }) => {
  const { issues, htmlDetails, cssDetails } = model;
  
  // Try to grab hScore and cScore from html/css details or bestPractices as fallback
  const htmlScore = htmlDetails?.score ?? (model as any).htmlScore ?? model.bestPracticesScore ?? 0;
  const cssScore = cssDetails?.score ?? (model as any).cssScore ?? model.bestPracticesScore ?? 0;
  
  const htmlIssues = issues.filter(i => i.category === 'html');
  const cssIssues = issues.filter(i => i.category === 'css');

  return (
    <ReportSection title="Html & CSS" number={10}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <ScoreGauge score={htmlScore} size={120} strokeWidth={8} />
          <span className="text-sm font-medium text-gray-500">Điểm HTML</span>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <ScoreGauge score={cssScore} size={120} strokeWidth={8} />
          <span className="text-sm font-medium text-gray-500">Điểm CSS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Các vấn đề HTML</h3>
          {htmlIssues.length > 0 ? (
            <div className="space-y-4">
              {htmlIssues.map((issue, idx) => (
                <div key={idx} className="bg-white border border-red-100 p-4 rounded-lg shadow-sm">
                   <div className="flex items-start justify-between">
                     <h4 className="font-medium text-gray-900 line-clamp-1 mr-2" title={issue.title || issue.id}>{issue.title || issue.id}</h4>
                     <StatusPill status={issue.severity === 'critical' || issue.severity === 'high' ? 'Fail' : issue.severity === 'medium' ? 'Warning' : 'Info'} />
                   </div>
                   <p className="text-sm text-gray-600 mt-2">{issue.description || issue.message}</p>
                   {issue.ruleId && <KnowledgeLink slug={issue.ruleId} className="mt-3" title="Tìm hiểu cách khắc phục" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Không phát hiện vấn đề HTML nghiêm trọng nào.
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Các vấn đề CSS</h3>
          {cssIssues.length > 0 ? (
            <div className="space-y-4">
              {cssIssues.map((issue, idx) => (
                <div key={idx} className="bg-white border border-red-100 p-4 rounded-lg shadow-sm">
                   <div className="flex items-start justify-between">
                     <h4 className="font-medium text-gray-900 line-clamp-1 mr-2" title={issue.title || issue.id}>{issue.title || issue.id}</h4>
                     <StatusPill status={issue.severity === 'critical' || issue.severity === 'high' ? 'Fail' : issue.severity === 'medium' ? 'Warning' : 'Info'} />
                   </div>
                   <p className="text-sm text-gray-600 mt-2">{issue.description || issue.message}</p>
                   {issue.ruleId && <KnowledgeLink slug={issue.ruleId} className="mt-3" title="Tìm hiểu cách khắc phục" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Không phát hiện vấn đề CSS nghiêm trọng nào.
            </div>
          )}
        </div>
      </div>
    </ReportSection>
  );
};
