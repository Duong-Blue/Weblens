import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, KnowledgeLink } from '../primitives';
import { knowledgeForIssue } from '../../../knowledge/knowledge';
import { ReportIssue } from '../reportModel';

interface PriorityPlanSectionProps {
  data: ReportModel;
}

export function PriorityPlanSection({ data }: PriorityPlanSectionProps) {
  const plan = data.priorityPlan || [];

  if (plan.length === 0) {
    return (
      <ReportSection title="Kế hoạch ưu tiên" number={12} pageBreak>
        <p className="text-gray-500 italic">Hiện tại không có vấn đề nào cần ưu tiên khắc phục.</p>
      </ReportSection>
    );
  }

  // Map internal buckets to actionable buckets
  const renderBucket = (bucketName: string, items: ReportIssue[], colorClass: string, bgClass: string, icon: React.ReactNode, label: string) => {
    if (items.length === 0) return null;
    return (
      <div className={`rounded-xl border ${colorClass} overflow-hidden break-inside-avoid mb-6 last:mb-0`}>
        <div className={`${bgClass} px-4 py-3 flex items-center gap-3 border-b ${colorClass}`}>
          {icon}
          <h3 className="font-bold text-gray-900">{label} <span className="text-sm font-normal text-gray-600">({items.length} hạng mục)</span></h3>
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {items.map((issue, idx) => {
             const know = knowledgeForIssue(issue);
             return (
               <div key={idx} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-start justify-between hover:bg-gray-50/30 transition-colors">
                 <div className="flex-1 space-y-2">
                   <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {know ? (
                        <KnowledgeLink slug={know.slug}>{issue.id || issue.ruleId || 'N/A'}</KnowledgeLink>
                      ) : (
                        <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{issue.id || issue.ruleId || 'N/A'}</span>
                      )}
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                   {issue.recommendation && (
                     <div className="mt-2 text-sm bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{issue.recommendation}</span>
                     </div>
                   )}
                 </div>
                 <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 shadow-sm whitespace-nowrap">
                       Effort: {issue.category}
                    </span>
                 </div>
               </div>
             )
          })}
        </div>
      </div>
    );
  };

  const getBucketItems = (search: string) => {
    return plan.find(p => p.bucket.toLowerCase().includes(search))?.issues || [];
  };

  const critical = getBucketItems('critical');
  const high = getBucketItems('high');
  const medium = getBucketItems('medium');

  return (
    <ReportSection title="Kế hoạch ưu tiên" number={12} pageBreak>
      <div className="space-y-6">
        {renderBucket('critical', critical, 'border-red-200', 'bg-red-50', (
           <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
             <span className="text-lg font-black leading-none">🔴</span>
           </div>
        ), 'Fix ngay (Ảnh hưởng nghiêm trọng)')}

        {renderBucket('high', high, 'border-orange-200', 'bg-orange-50', (
           <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
             <span className="text-lg font-black leading-none">🟡</span>
           </div>
        ), 'Có thể đợi (Nên xử lý sớm)')}

        {renderBucket('medium', medium, 'border-green-200', 'bg-green-50', (
           <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
             <span className="text-lg font-black leading-none">🟢</span>
           </div>
        ), 'Không cần gấp (Tối ưu thêm)')}
      </div>
    </ReportSection>
  );
}
