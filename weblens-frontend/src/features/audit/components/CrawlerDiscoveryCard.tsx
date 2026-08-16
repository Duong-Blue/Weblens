import React from 'react';

interface CrawlerDiscoveryCardProps {
  crawlData: {
    hasRobotsTxt?: boolean;
    hasSitemap?: boolean;
    isHttps?: boolean;
    totalUrls?: number;
    sitemapUrlCount?: number;
  } | null;
}

export const CrawlerDiscoveryCard: React.FC<CrawlerDiscoveryCardProps> = ({ crawlData }) => {
  const criteriaList = [
    { id: 'robots', label: 'Robots.txt Configuration', passed: crawlData?.hasRobotsTxt ?? false },
    { id: 'sitemap', label: 'Sitemap.xml Found', passed: crawlData?.hasSitemap ?? false },
    { id: 'https', label: 'HTTPS Usage', passed: crawlData?.isHttps ?? false },
    { id: 'url-count', label: `URLs Discovered (${crawlData?.totalUrls || 0})`, passed: (crawlData?.totalUrls ?? 0) > 0 },
    { id: 'sitemap-count', label: `Sitemap URLs (${crawlData?.sitemapUrlCount || 0})`, passed: (crawlData?.sitemapUrlCount ?? 0) > 0 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
        <h2 className="text-2xl font-bold text-zinc-900">Crawler Discovery</h2>
      </div>
      <div className="p-6">
        {crawlData ? (
          <ul className="space-y-3">
            {criteriaList.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <span className="text-zinc-700 font-medium">{item.label}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {item.passed ? 'Passed' : 'Failed'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Chưa có dữ liệu crawl.</p>
        )}
      </div>
    </div>
  );
};
