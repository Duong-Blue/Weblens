import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection, ScoreGauge, KnowledgeLink, StatusPill } from '../primitives';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const PerformanceSection: React.FC<{ model: ReportModel }> = ({ model }) => {
  const { coreWebVitals, resourceBreakdown, issues, improvements, categoryScores, loadTime, heavyResources, budgetStatus } = model;
  
  const perfIssues = issues.filter(i => i.category === 'performance');
  const perfImps = improvements.find(i => i.area.toLowerCase().includes('performance'))?.recommendations || [];

  const resourceData = Object.entries(resourceBreakdown || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <ReportSection title="Hiệu năng" number={4} pageBreak>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <ScoreGauge score={categoryScores.performance} size={120} strokeWidth={8} />
          <span className="text-sm font-medium text-gray-500">Điểm Hiệu suất</span>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Core Web Vitals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">LCP (Largest Contentful Paint)</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{coreWebVitals.lcp.value}</span>
                <StatusPill status={coreWebVitals.lcp.passed ? 'Pass' : coreWebVitals.lcp.value === '-' ? 'Info' : 'Fail'} />
              </div>
              <KnowledgeLink slug="lcp" className="mt-2" />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">CLS (Cumulative Layout Shift)</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{coreWebVitals.cls.value}</span>
                <StatusPill status={coreWebVitals.cls.passed ? 'Pass' : coreWebVitals.cls.value === '-' ? 'Info' : 'Fail'} />
              </div>
              <KnowledgeLink slug="cls" className="mt-2" />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">INP (Interaction to Next Paint)</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{coreWebVitals.inp.value}</span>
                <StatusPill status={coreWebVitals.inp.passed ? 'Pass' : coreWebVitals.inp.value === '-' ? 'Info' : 'Fail'} />
              </div>
              <KnowledgeLink slug="inp" className="mt-2" />
            </div>
          </div>
        </div>
      </div>

      {resourceData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Phân bổ tài nguyên mạng (Resource Breakdown)</h3>
          <div className="flex justify-center" style={{ width: '100%', height: 300 }}>
             {/* Not using ResponsiveContainer per MUST NOT DO */}
             <PieChart width={400} height={300}>
              <Pie
                data={resourceData}
                cx={200}
                cy={140}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={false}
              >
                {resourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value} bytes`} isAnimationActive={false} />
              <Legend />
            </PieChart>
          </div>
        </div>
      )}

      {perfIssues.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Các vấn đề phát hiện</h3>
           <div className="space-y-4">
              {perfIssues.map((issue, idx) => (
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

      {perfImps.length > 0 && (
        <div className="mt-8 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
           <h3 className="text-lg font-semibold text-blue-900 mb-4">Khuyến nghị AI</h3>
           <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
             {perfImps.map((rec, idx) => (
               <li key={idx}>{rec}</li>
             ))}
           </ul>
        </div>
      )}
    </ReportSection>
  );
};
