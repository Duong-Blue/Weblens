'use client';
import { AuditScreenshot } from '@/types/audit';
import React, { useState } from 'react';
import Image from 'next/image';

interface Props {
  screenshots?: AuditScreenshot[];
}

export function ScreenshotGallery({ screenshots }: Props) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<AuditScreenshot | null>(null);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const getBaseUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return apiUrl;
  };

  return (
    <div className="mt-8 mb-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Screenshots</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {screenshots.map((s, idx) => (
          <div 
            key={idx} 
            className="border rounded shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => setSelectedScreenshot(s)}
          >
            <div className="bg-gray-100 p-2 text-xs font-semibold uppercase text-center border-b">
              {s.viewport} {s.fullPage ? '(Full Page)' : ''}
            </div>
            <div className="h-48 relative bg-gray-50 flex items-center justify-center overflow-hidden">
               {/* Using next/image requires domains in next.config.mjs, fallback to standard img if not configured, but sticking to the plan: serve static */}
               <img 
                 src={`${getBaseUrl()}/${s.path}`} 
                 alt={`Screenshot ${s.viewport}`}
                 className="object-cover w-full h-full"
                 loading="lazy"
               />
            </div>
          </div>
        ))}
      </div>

      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="max-w-5xl max-h-screen overflow-auto relative bg-white p-2 rounded">
             <button 
               className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
               onClick={() => setSelectedScreenshot(null)}
             >
               &times;
             </button>
             <img 
                 src={`${getBaseUrl()}/${selectedScreenshot.path}`} 
                 alt={`Screenshot ${selectedScreenshot.viewport} full`}
                 className="max-w-full h-auto"
               />
          </div>
        </div>
      )}
    </div>
  );
}