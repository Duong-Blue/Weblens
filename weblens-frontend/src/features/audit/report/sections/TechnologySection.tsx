import * as React from 'react';
import { ReportModel } from '../reportModel';
import { ReportSection } from '../primitives';
import { TechItem } from '../../../../types/audit';

interface TechnologySectionProps {
  data: ReportModel;
}

export function TechnologySection({ data }: TechnologySectionProps) {
  const tools = data.tools || [];
  
  if (tools.length === 0) {
    return (
      <ReportSection title="8. Công nghệ & Nền tảng" number="8">
        <p className="text-gray-500 italic">Không phát hiện được công nghệ nào cụ thể.</p>
      </ReportSection>
    );
  }

  const grouped: Record<string, TechItem[]> = {};
  const others: TechItem[] = [];

  tools.forEach((tool: TechItem) => {
    const categories = Array.isArray(tool.category) ? tool.category : 
                      (tool.category ? [tool.category] : []);
                      
    if (categories.length > 0) {
      const firstCat = categories[0];
      let mainCat = 'Khác';
      if (typeof firstCat === 'string') {
        mainCat = firstCat;
      } else if (firstCat && typeof firstCat === 'object' && 'name' in firstCat) {
        mainCat = String((firstCat as Record<string, unknown>).name) || 'Khác';
      }
      if (!grouped[mainCat]) grouped[mainCat] = [];
      grouped[mainCat].push(tool);
    } else {
      others.push(tool);
    }
  });

  return (
    <ReportSection title="8. Công nghệ & Nền tảng" number="8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4 border border-gray-100 break-inside-avoid">
              <h3 className="font-semibold text-gray-900 mb-3 uppercase text-xs tracking-wider">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item: TechItem, idx: number) => {
                  const hasIcon = item && typeof item === 'object' && 'icon' in item;
                  const iconSrc = hasIcon ? String((item as Record<string, unknown>).icon) : null;
                  return (
                  <div key={idx} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm">
                    {iconSrc ? (
                       <img src={`https://wappalyzer.com/images/icons/${iconSrc}`} alt={item.name} className="w-4 h-4 object-contain" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
                    ) : null}
                    <span className="font-medium text-gray-800">{item.name}</span>
                    {item.version && <span className="text-gray-500 text-xs">v{item.version}</span>}
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
          {others.length > 0 && (
             <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 break-inside-avoid">
               <h3 className="font-semibold text-gray-900 mb-3 uppercase text-xs tracking-wider">Khác</h3>
               <div className="flex flex-wrap gap-2">
                 {others.map((item: TechItem, idx: number) => {
                   const hasIcon = item && typeof item === 'object' && 'icon' in item;
                   const iconSrc = hasIcon ? String((item as Record<string, unknown>).icon) : null;
                   return (
                   <div key={idx} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm">
                     {iconSrc ? (
                       <img src={`https://wappalyzer.com/images/icons/${iconSrc}`} alt={item.name} className="w-4 h-4 object-contain" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
                     ) : null}
                     <span className="font-medium text-gray-800">{item.name}</span>
                     {item.version && <span className="text-gray-500 text-xs">v{item.version}</span>}
                   </div>
                   );
                 })}
               </div>
             </div>
          )}
        </div>
      </div>
    </ReportSection>
  );
}
