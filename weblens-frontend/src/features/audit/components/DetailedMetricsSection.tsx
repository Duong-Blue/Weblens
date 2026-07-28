"use client";

import React, { useState } from "react";
import { AuditResult } from "@/types/audit";

export const DetailedMetricsSection = ({ result }: { result: Partial<AuditResult> }) => {
  const [activeTab, setActiveTab] = useState('performance');

  if (!result?.perfDetails && !result?.seoDetails && !result?.accDetails && !result?.securityDetails) return null;

  const tabs = [
    { id: 'performance', label: 'Performance' },
    { id: 'seo', label: 'SEO' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
      <div className="flex overflow-x-auto border-b border-zinc-200/60 hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-medium transition-colors relative whitespace-nowrap
              ${activeTab === tab.id 
                ? 'text-blue-600 bg-blue-50/50' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'performance' && (
          <div>
            <h3 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Performance Details
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Load Time</span>
                <span className="font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">{result.perfDetails?.loadTimeMs || 0} ms</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Heavy Resources</span>
                <span className="font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">{result.perfDetails?.heavyResources || 0} files</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Total Requests</span>
                <span className="font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">{result.networkDetails?.totalRequests || 0}</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">JS Errors</span>
                <span className={`font-medium px-2.5 py-0.5 rounded-full ${(result.jsErrorsDetails?.errorCount ?? 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-zinc-100 text-zinc-900'}`}>
                  {result.jsErrorsDetails?.errorCount || 0}
                </span>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'seo' && (
          <div>
            <h3 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              SEO Details
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col gap-1.5 py-1 border-b border-zinc-100/50">
                <span className="flex justify-between items-center">
                  <span className="text-zinc-500">Title Tag</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${result.seoDetails?.hasTitle ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {result.seoDetails?.hasTitle ? "Present" : "Missing"}
                  </span>
                </span>
                {result.seoDetails?.title && <span className="text-xs text-zinc-400 truncate">{result.seoDetails.title}</span>}
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Meta Description</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${result.seoDetails?.hasMetaDescription ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {result.seoDetails?.hasMetaDescription ? "Present" : "Missing"}
                </span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">H1 Heading</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${result.seoDetails?.hasH1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {result.seoDetails?.hasH1 ? `${result.seoDetails.h1Count} found` : "Missing"}
                </span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Total Links</span>
                <span className="font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">{result.seoDetails?.linksCount || 0}</span>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div>
            <h3 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Accessibility Details
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Missing Aria Labels</span>
                <span className="font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">{result.accDetails?.missingAriaLabels || 0}</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Image Alt Tags Missing</span>
                <span className={`font-medium px-2.5 py-0.5 rounded-full ${(result.accDetails?.imagesWithoutAlt ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {result.accDetails?.imagesWithoutAlt || 0}
                </span>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h3 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Security Details
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">HTTPS Usage</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${result.securityDetails?.isHttps ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {result.securityDetails?.isHttps ? "Secure" : "Insecure"}
                </span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-zinc-100/50 last:border-0">
                <span className="text-zinc-500">Cookie Security</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${result.securityDetails?.cookies?.missingSecure === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {result.securityDetails?.cookies?.missingSecure === 0 ? "All Secure" : `${result.securityDetails?.cookies?.missingSecure || 0} insecure`}
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
