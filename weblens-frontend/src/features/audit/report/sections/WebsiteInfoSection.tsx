import * as React from 'react';
import { ReportSection, KeyValueGrid } from '../primitives';
import { ReportModel } from '../reportModel';

interface WebsiteInfoSectionProps {
  report: ReportModel;
  url: string;
  auditId: string;
}

export const WebsiteInfoSection: React.FC<WebsiteInfoSectionProps> = ({ report, url, auditId }) => {
  const isHttps = url.startsWith('https://');
  
  const frameworks = report.tools.filter(t => {
     const catStr = Array.isArray((t as unknown as { categories?: { name?: string }[] }).categories) 
       ? ((t as unknown as { categories?: { name?: string }[] }).categories || []).map(c => c.name || '').join(' ') 
       : (t.category || '');
     return catStr.includes('Web frameworks') || catStr.includes('JavaScript frameworks');
  }).map(t => t.name).join(', ') || 'N/A';
  
  const server = report.tools.filter(t => {
     const catStr = Array.isArray((t as unknown as { categories?: { name?: string }[] }).categories) 
       ? ((t as unknown as { categories?: { name?: string }[] }).categories || []).map(c => c.name || '').join(' ') 
       : (t.category || '');
     return catStr.includes('Web servers');
  }).map(t => t.name).join(', ') || 'N/A';

  const cdn = report.tools.filter(t => {
     const catStr = Array.isArray((t as unknown as { categories?: { name?: string }[] }).categories) 
       ? ((t as unknown as { categories?: { name?: string }[] }).categories || []).map(c => c.name || '').join(' ') 
       : (t.category || '');
     return catStr.includes('CDN');
  }).map(t => t.name).join(', ') || 'N/A';

  const gridItems = [
    { label: 'URL', value: url },
    { label: 'HTTPS', value: isHttps ? 'Có (Secured)' : 'Không (Unsecured)' },
    { label: 'Framework/CMS', value: frameworks },
    { label: 'Máy chủ (Server)', value: server },
    { label: 'CDN', value: cdn },
    { label: 'Thiết bị kiểm tra', value: 'Desktop (Mô phỏng)' },
    { label: 'Mã báo cáo', value: auditId }
  ];

  const getImageUrl = (pathOrUrl: string | undefined) => {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/reports/${pathOrUrl}`;
  };

  const desktopScreenshot = report.screenshots.find(s => s.viewport === 'desktop' || (s.path && !s.viewport));
  const mobileScreenshot = report.screenshots.find(s => s.viewport === 'mobile');

  return (
    <ReportSection title="Thông tin Website" number="3">
      <div className="mb-8">
        <KeyValueGrid items={gridItems} />
      </div>

      {(desktopScreenshot || mobileScreenshot) && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Ảnh SERP (Google)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {desktopScreenshot && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  SERP — Desktop
                </div>
                <div className="relative aspect-video">
                  <img src={getImageUrl(desktopScreenshot.path || (desktopScreenshot as unknown as { url?: string }).url)} alt="Desktop view" className="object-cover w-full h-full object-top" />
                </div>
              </div>
            )}
            
            {mobileScreenshot && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm md:max-w-xs mx-auto w-full">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  SERP — Mobile
                </div>
                <div className="relative aspect-[9/16]">
                  <img src={getImageUrl(mobileScreenshot.path || (mobileScreenshot as unknown as { url?: string }).url)} alt="Mobile view" className="object-cover w-full h-full object-top" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ReportSection>
  );
};
