import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, ScoreGauge, KnowledgeLink, StatusPill } from '../primitives';

export const SecuritySection: React.FC<{ model: ReportModel }> = ({ model }) => {
  const { issues, improvements, categoryScores, securityDetails } = model;
  
  const secIssues = issues.filter(i => i.category === 'security');
  const secImps = improvements.find(i => i.area.toLowerCase().includes('security'))?.recommendations || [];

  return (
    <ReportSection title="Bảo mật" number={7} pageBreak>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex flex-col items-center justify-center space-y-4 w-full md:w-1/3">
          <ScoreGauge score={categoryScores.security} size={120} strokeWidth={8} />
          <span className="text-sm font-medium text-gray-500">Điểm Bảo mật</span>
        </div>
        <div className="w-full md:w-2/3">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tổng quan</h3>
            {securityDetails && securityDetails.mozillaGrade && (
              <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mozilla Observatory Grade</span>
                <span className={`text-xl font-bold ${
                  ['A', 'B'].includes(securityDetails.mozillaGrade) ? 'text-green-600' :
                  ['C', 'D'].includes(securityDetails.mozillaGrade) ? 'text-yellow-600' : 'text-red-600'
                }`}>{securityDetails.mozillaGrade}</span>
              </div>
            )}
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              <li>Chứng chỉ SSL/TLS: {securityDetails?.ssl?.valid ? 'Hợp lệ' : 'Không hợp lệ/Chưa cấu hình'}</li>
              <li>Các HTTP Headers bảo mật (HSTS, CSP, X-Frame-Options)</li>
              <li>Bảo mật Cookies (Secure, HttpOnly, SameSite)</li>
              <li>Cấu hình CORS</li>
              <li>Các lỗ hổng phổ biến (Vulnerabilities): {securityDetails?.vulnerabilitiesFound || 0}</li>
            </ul>
        </div>
      </div>

      {securityDetails && securityDetails.headers && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">HTTP Security Headers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(securityDetails.headers).map(([header, isPresent]) => (
              <div key={header} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 truncate mr-2" title={header}>{header}</span>
                <StatusPill status={isPresent ? 'Pass' : 'Fail'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {secIssues.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Các vấn đề phát hiện</h3>
           <div className="space-y-4">
              {secIssues.map((issue, idx) => (
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

      {secImps.length > 0 && (
        <div className="mt-8 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
           <h3 className="text-lg font-semibold text-blue-900 mb-4">Khuyến nghị AI</h3>
           <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
             {secImps.map((rec, idx) => (
               <li key={idx}>{rec}</li>
             ))}
           </ul>
        </div>
      )}
    </ReportSection>
  );
};
