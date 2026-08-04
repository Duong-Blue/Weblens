import * as React from 'react';
import { ScoreGauge } from '../primitives';
import { ReportModel } from '../reportModel';

interface CoverSectionProps {
  report: ReportModel;
  url: string;
}

export const CoverSection: React.FC<CoverSectionProps> = ({ report, url }) => {
  return (
    <div className="report-page-break flex flex-col items-center justify-center min-h-[800px] text-center mb-16 pt-20 px-4">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4 uppercase">
          BÁO CÁO KIỂM TRA WEBSITE
        </h1>
        <div className="text-xl md:text-2xl text-blue-600 font-bold mb-2 break-all max-w-3xl mx-auto">
          {url}
        </div>
        <div className="text-gray-500 font-medium">
          Ngày kiểm tra: {report.generatedAtFormatted}
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center max-w-sm w-full mx-auto">
        <h2 className="text-gray-600 font-semibold mb-6 uppercase tracking-widest text-sm">
          Điểm Tổng Quan
        </h2>
        <ScoreGauge score={report.overallScore} size={200} strokeWidth={16} />
      </div>
      
      <div className="mt-20 print:hidden text-gray-400">
        <svg className="w-8 h-8 animate-bounce mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
};
