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

  return (
    <ReportSection title="Thông tin website" number={4}>
      <div className="mb-8">
        <KeyValueGrid items={gridItems} />
      </div>
    </ReportSection>
  );
};
