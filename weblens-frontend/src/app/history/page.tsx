"use client";

import { useGetAuditsQuery } from "@/services/api/auditApi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAuditsQuery({ page, limit: 10 });
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Loading history...</p>
      </div>
    );
  }

  const audits = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-blue-600">Audit History</h1>
            <Link href="/dashboard" className="text-sm px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-medium text-gray-600">URL</th>
                <th className="p-4 font-medium text-gray-600">Date</th>
                <th className="p-4 font-medium text-gray-600">Status</th>
                <th className="p-4 font-medium text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {audits.length > 0 ? audits.map((audit: any) => (
                <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-900">{audit.url}</td>
                  <td className="p-4 text-gray-500">{new Date(audit.createdAt).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      audit.status === 'completed' ? 'bg-green-100 text-green-700' :
                      audit.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => router.push(`/dashboard?auditId=${audit.id}`)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No audits found.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {meta && meta.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {meta.totalPages}</span>
              <button 
                disabled={page === meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
