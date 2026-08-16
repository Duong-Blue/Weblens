import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection } from '../primitives';

interface ConclusionSectionProps {
  data: ReportModel;
}

export function ConclusionSection({ data }: ConclusionSectionProps) {
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Tốt', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 50) return { label: 'Cần cải thiện', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'Kém', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const status = getScoreLabel(data.overallScore);
  
  // Deduplicate recommendations
  const allRecs = new Set<string>();
  data.improvements?.forEach(imp => {
    imp.recommendations.forEach(r => allRecs.add(r));
  });
  const dedupedRecs = Array.from(allRecs).slice(0, 5); // Limit to top 5

  return (
    <ReportSection title="Kết luận" number={13}>
      <div className="space-y-6">
        <div className={`p-6 rounded-xl border ${status.border} ${status.bg} flex flex-col md:flex-row items-center gap-6`}>
          <div className="flex-shrink-0 text-center">
            <div className={`text-4xl font-black ${status.color}`}>{data.overallScore}/100</div>
            <div className={`text-sm font-semibold uppercase tracking-wider mt-1 ${status.color}`}>
              {status.label}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 leading-relaxed font-medium">
              Dựa trên kết quả phân tích tổng thể, website đạt điểm số {data.overallScore}/100.
              {data.overallScore >= 90 
                ? ' Trang web được tối ưu hóa rất tốt, tuy nhiên vẫn có thể cải thiện thêm ở một số chi tiết nhỏ.'
                : data.overallScore >= 50
                ? ' Trang web hoạt động ổn định nhưng cần tối ưu hóa thêm về hiệu suất và trải nghiệm người dùng để đạt tiêu chuẩn tốt nhất.'
                : ' Trang web đang gặp nhiều vấn đề nghiêm trọng cần được khắc phục ngay lập tức để không ảnh hưởng xấu đến người dùng và SEO.'}
            </p>
          </div>
        </div>

        {dedupedRecs.length > 0 && (
          <div className="mt-8 break-inside-avoid">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Hướng cải thiện chính</h3>
            <ul className="space-y-3">
              {dedupedRecs.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-gray-700 leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ReportSection>
  );
}
