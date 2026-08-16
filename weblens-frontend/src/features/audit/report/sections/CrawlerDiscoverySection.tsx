import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, CriteriaChecklist } from '../primitives';

export const CrawlerDiscoverySection: React.FC<{ model: ReportModel }> = ({ model }) => {
  const { crawlData } = model;

  const criteriaList = crawlData ? [
    { id: 'robots', label: 'Robots.txt Configuration', passed: crawlData.hasRobotsTxt },
    { id: 'sitemap', label: 'Sitemap.xml Found', passed: crawlData.hasSitemap },
    { id: 'https', label: 'HTTPS Usage', passed: crawlData.isHttps },
    { id: 'url-count', label: `URLs Discovered (${crawlData.totalUrls || 0})`, passed: crawlData.totalUrls > 0 },
    { id: 'sitemap-count', label: `Sitemap URLs (${crawlData.sitemapUrlCount || 0})`, passed: crawlData.sitemapUrlCount > 0 },
  ] : [];

  return (
    <ReportSection title="Crawler & Discovery" number={2} pageBreak>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Discovery Metrics</h3>
        {criteriaList.length > 0 ? (
          <CriteriaChecklist items={criteriaList} />
        ) : (
          <p className="text-sm text-gray-500">Chưa có dữ liệu crawl.</p>
        )}
      </div>
    </ReportSection>
  );
};
