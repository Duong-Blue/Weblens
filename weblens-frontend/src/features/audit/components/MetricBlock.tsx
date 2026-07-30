import React, { ReactNode } from 'react';
import { ReferenceLink } from '@/types/audit';

interface MetricBlockProps {
  title: string;
  score: number;
  details: ReactNode;
  analysis?: string;
  fixSteps?: string[];
  links?: ReferenceLink[];
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

export const MetricBlock: React.FC<MetricBlockProps> = ({
  title,
  score,
  details,
  analysis,
  fixSteps,
  links,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium">Score</div>
            <div className={`text-3xl font-black ${getScoreColor(score)}`}>
              {score}
              <span className="text-lg text-gray-400 font-normal">/100</span>
            </div>
          </div>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getScoreBg(score)}`}>
            {score}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Metrics & Data
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            {details}
          </div>
        </div>

        {/* Right Column: AI Analysis & Fixes */}
        <div className="space-y-6">
          {analysis && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2 text-xl">🤖</span>
                AI Analysis
              </h3>
              <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm leading-relaxed border border-blue-100 shadow-inner">
                {analysis}
              </div>
            </div>
          )}

          {fixSteps && fixSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2 text-xl">🔧</span>
                Recommended Fixes
              </h3>
              <ul className="space-y-2">
                {fixSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start bg-white border border-gray-100 p-3 rounded shadow-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {links && links.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2 text-xl">📚</span>
                References
              </h3>
              <div className="flex flex-wrap gap-2">
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {link.title}
                    <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};