import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, ScoreGauge, CriteriaChecklist, KnowledgeLink, StatusPill } from '../primitives';

export const SeoSection: React.FC<{ model: ReportModel }> = ({ model }) => {
  const { categoryScores, issues, improvements, seoDetails } = model;
  
  const seoIssues = issues.filter(i => i.category === 'seo');
  const seoImps = improvements.find(i => i.area.toLowerCase().includes('seo'))?.recommendations || [];

  const criteriaList = seoDetails ? [
    { id: 'meta-title', label: 'Meta Title', passed: seoDetails.meta?.hasTitle || false },
    { id: 'meta-desc', label: 'Meta Description', passed: seoDetails.meta?.hasDescription || false },
    { id: 'robots-txt', label: 'Robots.txt', passed: seoDetails.robotsTxt?.exists || false },
    { id: 'sitemap', label: 'Sitemap.xml', passed: seoDetails.sitemap?.exists || false },
    { id: 'canonical', label: 'Canonical Tag', passed: seoDetails.canonical?.exists || false },
    { id: 'h1', label: 'H1 Tag (Exactly One)', passed: seoDetails.headings?.h1Count === 1 },
  ] : [];

  return (
    <ReportSection title="SEO" number={5} pageBreak>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <ScoreGauge score={categoryScores.seo} size={120} strokeWidth={8} />
          <span className="text-sm font-medium text-gray-500">Điểm SEO</span>
        </div>
        
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tiêu chí cơ bản</h3>
          {criteriaList.length > 0 ? (
            <CriteriaChecklist items={criteriaList} />
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu chi tiết SEO.</p>
          )}
        </div>
      </div>

      {seoIssues.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Các vấn đề phát hiện</h3>
           <div className="space-y-4">
              {seoIssues.map((issue, idx) => (
                <div key={idx} className="bg-white border border-red-100 p-4 rounded-lg shadow-sm">
                   <div className="flex items-start justify-between">
                     <h4 className="font-medium text-gray-900">{issue.title || issue.id}</h4>
                     <StatusPill status={issue.severity === 'critical' || issue.severity === 'high' ? 'Fail' : 'Warning'} />
                   </div>
                   <p className="text-sm text-gray-600 mt-2">{issue.description}</p>
                   {issue.id && <KnowledgeLink slug={issue.id} className="mt-3" title="Tìm hiểu cách khắc phục" />}
                </div>
              ))}
           </div>
        </div>
      )}

      {seoImps.length > 0 && (
        <div className="mt-8 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
           <h3 className="text-lg font-semibold text-blue-900 mb-4">Khuyến nghị AI</h3>
           <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
             {seoImps.map((rec, idx) => (
               <li key={idx}>{rec}</li>
             ))}
           </ul>
        </div>
      )}
    </ReportSection>
  );
};
