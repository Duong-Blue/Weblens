"use client";

import React, { use } from 'react';
import { useGetAuditResultQuery } from '@/services/api/auditApi';
import { AuditReport } from '@/features/audit/report/AuditReport';
import { Button } from '@/components/ui/button';
import { Printer, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { data, isLoading, isError, error } = useGetAuditResultQuery(id, {
    skip: !id,
  });

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `WebLens_Report_${id}`;
    window.print();
    document.title = originalTitle;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-600 font-medium">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (isError || !data?.result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Không tìm thấy báo cáo</h2>
          <p className="text-zinc-500 mb-6">
            Báo cáo bạn đang tìm kiếm không tồn tại, đang được xử lý, hoặc có lỗi xảy ra.
            {error && <span className="block mt-2 text-xs text-red-400">{JSON.stringify(error)}</span>}
          </p>
          <Link href="/">
            <Button className="w-full bg-zinc-900 text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const audit = data?.audit || {};
  const result = data?.result;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Top Action Bar - Hidden during printing */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 print:hidden shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Trang chủ
              </Button>
            </Link>
            <div className="h-4 w-px bg-zinc-300"></div>
            <span className="text-sm font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-md">
              Báo cáo: {audit?.url || id}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handlePrint}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Xuất PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Report Content */}
      <main className="max-w-6xl mx-auto pt-8 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/40 border border-zinc-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <AuditReport result={result as any} url={audit?.url || ''} />
        </div>
      </main>
    </div>
  );
}