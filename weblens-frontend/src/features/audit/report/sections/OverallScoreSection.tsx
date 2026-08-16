import React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, ScoreGauge, ScoreTable } from '../primitives';

interface OverallScoreSectionProps {
  model: ReportModel;
}

export function OverallScoreSection({ model }: OverallScoreSectionProps) {
  const { overallScore, categoryScores } = model;
  
  const scoreTableRows = [
    { label: 'Performance', score: categoryScores?.performance ?? 0 },
    { label: 'SEO', score: categoryScores?.seo ?? 0 },
    { label: 'Accessibility', score: categoryScores?.accessibility ?? 0 },
    { label: 'Security', score: categoryScores?.security ?? 0 },
  ];

  return (
    <ReportSection title="Điểm tổng quan" number={0}>
      <div className="flex flex-col md:flex-row items-center gap-8 justify-center py-6">
        <div className="flex flex-col items-center gap-4">
          <ScoreGauge score={overallScore ?? 0} size={160} strokeWidth={12} />
          <span className="text-xl font-bold text-gray-700">Điểm tổng quan</span>
        </div>
        <div className="flex-1 w-full max-w-md">
          <ScoreTable rows={scoreTableRows} />
        </div>
      </div>
    </ReportSection>
  );
}
