import * as React from 'react';
import { ReportSection } from '../primitives';
import { ReportModel } from '../reportModel';

interface AiSummarySectionProps {
  model: ReportModel;
}

export const AiSummarySection: React.FC<AiSummarySectionProps> = ({ model }) => {
  return (
    <ReportSection title="Tóm tắt" number={3} pageBreak>
      {model.summaryParagraphs && model.summaryParagraphs.length > 0 ? (
        <div className="prose prose-sm prose-blue max-w-none text-gray-700">
          {model.summaryParagraphs.map((paragraph, idx) => (
            <p key={idx} className="mb-4">{paragraph}</p>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 italic text-sm">
          Không có tóm tắt AI cho báo cáo này.
        </div>
      )}
    </ReportSection>
  );
};
