import * as React from 'react';
import { ReportSection, ScoreTable } from '../primitives';
import { ReportModel } from '../reportModel';

interface SummarySectionProps {
  report: ReportModel;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ report }) => {
  const scoreItems = [
    { label: 'Hiệu năng', score: report.categoryScores.performance },
    { label: 'SEO', score: report.categoryScores.seo },
    { label: 'Accessibility', score: report.categoryScores.accessibility },
    { label: 'Best Practices', score: report.bestPracticesScore },
    { label: 'Bảo mật', score: report.categoryScores.security },
  ];

  return (
    <ReportSection title="Tóm tắt" number={2} pageBreak>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Tổng quan từ AI</h3>
          {report.summaryParagraphs && report.summaryParagraphs.length > 0 ? (
            <div className="prose prose-sm prose-blue max-w-none text-gray-700">
              {report.summaryParagraphs.map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
          ) : (
             <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 italic text-sm">
              Không có tóm tắt AI cho báo cáo này.
            </div>
          )}
        </div>
      
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Điểm đánh giá chi tiết
          </h3>
          <ScoreTable rows={scoreItems} />
        </div>
      </div>
    </ReportSection>
  );
};
