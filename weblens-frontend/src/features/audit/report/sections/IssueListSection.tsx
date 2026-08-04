import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, StatusPill, KnowledgeLink } from '../primitives';
import { knowledgeForIssue } from '../../../knowledge/knowledge';

interface IssueListSectionProps {
  data: ReportModel;
}

export function IssueListSection({ data }: IssueListSectionProps) {
  const issues = data.issues || [];
  
  if (issues.length === 0) {
    return (
      <ReportSection title="Danh sách vấn đề" number={9} pageBreak>
        <p className="text-gray-500 italic">Không phát hiện vấn đề nào cần xử lý chi tiết.</p>
      </ReportSection>
    );
  }

  const formatSeverity = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return <StatusPill status="Fail" className="bg-red-600 text-white border-red-700" />;
      case 'high': return <StatusPill status="Fail" />;
      case 'medium': return <StatusPill status="Warning" />;
      case 'low': return <StatusPill status="Info" />;
      default: return <StatusPill status="Info" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'performance': return 'Hiệu năng';
      case 'seo': return 'SEO';
      case 'accessibility': return 'Accessibility';
      case 'security': return 'Bảo mật';
      default: return cat;
    }
  };

  return (
    <ReportSection title="Danh sách vấn đề" number={9} pageBreak>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 w-[15%]">Mã lỗi</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 w-[10%] whitespace-nowrap">Mức độ</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 w-[15%]">Hạng mục</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 w-[30%]">Mô tả</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 w-[30%]">Khuyến nghị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {issues.map((issue, idx) => {
              const know = knowledgeForIssue(issue);
              return (
                <tr key={idx} className="break-inside-avoid hover:bg-gray-50/50">
                  <td className="px-4 py-3 align-top font-mono text-xs text-gray-600">
                    {know ? (
                      <KnowledgeLink slug={know.slug}>{issue.id || issue.ruleId || 'N/A'}</KnowledgeLink>
                    ) : (
                      issue.id || issue.ruleId || 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {formatSeverity(issue.severity)}
                  </td>
                  <td className="px-4 py-3 align-top text-gray-700 font-medium">
                    {getCategoryLabel(issue.category || '')}
                  </td>
                  <td className="px-4 py-3 align-top text-gray-600">
                    <p className="line-clamp-3" title={issue.description}>{issue.description}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-600">
                    {issue.recommendation ? (
                       <p className="line-clamp-3">{issue.recommendation}</p>
                    ) : (
                       <span className="text-gray-400 italic">Không có khuyến nghị cụ thể</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}
