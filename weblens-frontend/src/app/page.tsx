"use client";

import { useState, useEffect } from "react";
import { useCreateAudit, useLazyAuditResult } from "@/features/audit/hooks/useAudit";
import { useSocket } from "@/features/audit/hooks/useSocket";
import { TechStackSection } from "@/features/audit/components/TechStackSection";
import { AiSummarySection } from "@/features/audit/components/AiSummarySection";
import { MetricBlock } from "@/features/audit/components/MetricBlock";
import { ScreenshotGallery } from "@/features/audit/components/ScreenshotGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditResult } from "@/types/audit";
import Link from "next/link";

type LiveDataType = Partial<AuditResult> & { error?: string };

export default function Home() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

  const [liveData, setLiveData] = useState<LiveDataType | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>("");

  const [createAudit, { isLoading: isCreating, isError: isCreateError, error: createError }] = useCreateAudit();

  const socket = useSocket(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

  const [triggerFetch, { data: auditData }] = useLazyAuditResult();

  useEffect(() => {
    if (socket && activeAuditId) {
      const eventName = `audit-progress-${activeAuditId}`;
      console.log(`Subscribing to WS event: ${eventName}`);
      
      socket.on(eventName, (payload: unknown) => {
        console.log(`WS Payload received for ${activeAuditId}:`, payload);
        
        const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
        
        const { step, data } = parsedPayload;
        
        setLiveStatus(step);

        if (step === 'analyzed') {
          setLiveData((prev: LiveDataType | null) => ({ ...prev, ...data }));
          setLiveStatus('analyzed');
        }

        if (step === 'summarized') {
          setLiveData((prev: LiveDataType | null) => ({ ...prev, aiSummary: data?.aiSummary }));
          setLiveStatus('summarized');
        }

        if (step === 'completed' && !auditData) {
          if (data) {
            setLiveData(data);
          }
          setLiveStatus('completed');
          triggerFetch(activeAuditId);
        }

        if (step === 'failed') {
          setLiveStatus('failed');
          setLiveData((prev: LiveDataType | null) => ({ ...prev, error: data?.errorMessage }));
        }
      });
    }

    return () => {
      if (socket && activeAuditId) {
        console.log(`Unsubscribing from WS event: audit-progress-${activeAuditId}`);
        socket.off(`audit-progress-${activeAuditId}`);
      }
    };
  }, [socket, activeAuditId, triggerFetch, auditData]);

  const status = liveStatus || (auditData as any)?.data?.audit?.status || (auditData as any)?.audit?.status;
  const result = liveData || (auditData as any)?.data?.result || (auditData as any)?.result;
  const isAuditRunning = status === 'pending' || status === 'processing' || status === 'crawling';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");
    if (!url) return;

    let submitUrl = url.trim();
    
    // Tự động thêm https:// nếu thiếu
    if (!/^https?:\/\//i.test(submitUrl)) {
      submitUrl = 'https://' + submitUrl;
    }

    // Regex kiểm tra domain hợp lệ (yêu cầu có dấu . và ít nhất 2 ký tự sau dấu .)
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
    if (!urlPattern.test(submitUrl)) {
      setUrlError("Vui lòng nhập tên miền hợp lệ (VD: example.com)");
      return;
    }

    setActiveAuditId(null);
    setLiveData(null);
    setLiveStatus("");

    createAudit({ url: submitUrl, anonymous: true })
      .unwrap()
      .then((res: any) => {
        console.log('Create audit response:', res);
        
        const finalAuditId = res?.audit?.id || res?.id || res?.data?.audit?.id;
        
        if (finalAuditId) {
          setActiveAuditId(finalAuditId);
          setLiveStatus('pending');
        } else {
          setUrlError("Không thể lấy ID báo cáo. Vui lòng thử lại.");
        }
      })
      .catch((err) => {
        console.error('Error creating audit:', err);
        setUrlError("Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại.");
      });
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans min-h-screen relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex w-full max-w-6xl flex-col items-center py-20 px-6 sm:px-16 relative z-10">
        <div className="flex flex-col items-center gap-8 text-center w-full max-w-3xl mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tighter text-zinc-900 leading-[1.1] drop-shadow-sm">
            Đánh giá website, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600">
              tự động bằng AI.
            </span>
          </h1>
          <p className="text-2xl text-zinc-500 mt-2 max-w-2xl font-medium leading-relaxed">
            Nhập bất kỳ tên miền nào để phân tích toàn diện về Hiệu suất, SEO, Trải nghiệm và Bảo mật.
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-10 max-w-2xl">
            <div className={`w-full flex flex-col sm:flex-row gap-3 shadow-2xl shadow-blue-900/10 rounded-2xl p-3 bg-white/70 backdrop-blur-md border ${urlError ? 'border-red-500' : 'border-white'} shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ${urlError ? 'ring-red-500/50' : 'ring-zinc-900/5'} transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
              <Input
                type="text"
                placeholder="https://example.com"
                className="flex-1 px-6 py-5 text-xl font-medium border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-400 h-auto"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError("");
                }}
                disabled={isCreating || isAuditRunning}
              />
              <Button
                type="submit"
                disabled={!url || isCreating || isAuditRunning}
                className="px-10 py-6 text-lg h-auto rounded-xl shadow-md font-bold transition-all hover:scale-[1.02] bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {isCreating || isAuditRunning ? "Đang xử lý..." : "Đánh Giá Ngay"}
              </Button>
            </div>
            {urlError && <p className="text-red-500 text-sm font-medium text-left px-2 animate-in fade-in slide-in-from-top-2">{urlError}</p>}
          </form>
        </div>

        {(activeAuditId || isCreateError) && (
          <Card className="w-full max-w-5xl mb-24 overflow-hidden shadow-2xl shadow-blue-900/5 border-white/60 bg-white/60 backdrop-blur-xl ring-1 ring-zinc-900/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both rounded-3xl">
            <div className="px-10 py-8 border-b border-zinc-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40">
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                Báo cáo cho
                <span className="px-4 py-1.5 bg-zinc-900/5 text-zinc-800 rounded-lg font-semibold text-lg ml-1 border border-zinc-900/10 shadow-sm">
                  {(auditData as any)?.data?.audit?.url || (auditData as any)?.audit?.url || url}
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline-block">Trạng thái</span>
                <Badge variant={status === 'completed' ? 'success' : (status === 'failed' || isCreateError) ? 'warning' : 'neutral'} className={status !== 'completed' && status !== 'failed' && !isCreateError ? 'animate-pulse py-1.5 px-4 shadow-sm text-sm font-semibold' : 'py-1.5 px-4 shadow-sm text-sm font-semibold'}>
                  {isCreateError ? 'thất bại' : (status || 'đang khởi tạo')}
                </Badge>
              </div>
            </div>

            {isAuditRunning && !isCreateError && (
              <div className="p-10 sm:p-14 space-y-12">
                <div className="flex items-center gap-4 text-blue-700 mb-6 bg-blue-50/80 p-5 rounded-2xl border border-blue-100/60 shadow-sm backdrop-blur-sm">
                  <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="font-semibold text-lg">
                    {status === 'crawling' ? 'Bước 1: Đang thu thập dữ liệu website...' : 'Đang chuẩn bị đánh giá...'}
                  </span>
                </div>

                <section>
                  <div className="h-7 w-48 bg-zinc-200/60 rounded-md animate-pulse mb-5"></div>
                  <div className="flex gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 w-28 bg-zinc-200/60 rounded-full animate-pulse"></div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="h-7 w-40 bg-zinc-200/60 rounded-md animate-pulse mb-8"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="p-8 rounded-3xl border border-zinc-200/50 bg-white/40 flex flex-col items-center justify-center gap-4 animate-pulse shadow-sm">
                        <div className="h-16 w-16 rounded-full bg-zinc-200/60"></div>
                        <div className="h-5 w-24 bg-zinc-200/60 rounded"></div>
                        <div className="h-10 w-20 bg-zinc-200/60 rounded mt-2"></div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white/40 p-8 sm:p-10 rounded-3xl border border-zinc-200/50 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-zinc-200/60 animate-pulse"></div>
                    <div className="h-7 w-72 bg-zinc-200/60 rounded-md animate-pulse"></div>
                  </div>
                  <div className="space-y-5">
                    <div className="h-5 w-full bg-zinc-200/60 rounded animate-pulse"></div>
                    <div className="h-5 w-[92%] bg-zinc-200/60 rounded animate-pulse"></div>
                    <div className="h-5 w-[96%] bg-zinc-200/60 rounded animate-pulse"></div>
                    <div className="h-5 w-[85%] bg-zinc-200/60 rounded animate-pulse"></div>
                  </div>
                </section>
              </div>
            )}

            {(status === 'failed' || isCreateError) && (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <span className="font-semibold text-xl text-zinc-900">Đánh giá thất bại</span>
                <span className="text-zinc-500 max-w-md">
                  {isCreateError ? (createError as any)?.response?.data?.message || (createError as any)?.data?.message || "Không thể tạo yêu cầu đánh giá." :
                    (liveData?.error?.includes("ERR_NAME_NOT_RESOLVED") || (auditData as any)?.data?.result?.error?.includes("ERR_NAME_NOT_RESOLVED") || (auditData as any)?.result?.error?.includes("ERR_NAME_NOT_RESOLVED")
                      ? "Không thể phân giải tên miền. Vui lòng kiểm tra lại URL và thử lại."
                      : "Vui lòng kiểm tra lại URL và thử lại.")}
                </span>
              </div>
            )}

            {result && (
              <div className="p-10 sm:p-14 space-y-16">
                <TechStackSection techStack={result.techStack} />
                
                {result.screenshots ? (
                  <ScreenshotGallery screenshots={result.screenshots} />
                ) : (
                  <div className="flex items-center justify-center p-12 bg-zinc-50 rounded-3xl border border-zinc-200/50 shadow-sm animate-pulse">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin"></div>
                      <span className="font-medium">Generating screenshots...</span>
                    </div>
                  </div>
                )}
                
                <section>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-8">Detailed Analysis</h3>
                  
                  <MetricBlock 
                    title="Performance" 
                    score={result.perfScore ?? 0} 
                    details={
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Load Time</span>
                          <span className="font-bold text-zinc-900">{result.perfDetails?.loadTimeMs || 0} ms</span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Heavy Resources</span>
                          <span className="font-bold text-zinc-900">{result.perfDetails?.heavyResources || 0} files</span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Total Requests</span>
                          <span className="font-bold text-zinc-900">{result.networkDetails?.totalRequests || 0}</span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">JS Errors</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${(result.jsErrorsDetails?.errorCount ?? 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {result.jsErrorsDetails?.errorCount || 0}
                          </span>
                        </li>
                      </ul>
                    }
                    analysis={result.aiCategoryAnalysis?.performance?.analysis}
                    fixSteps={result.aiCategoryAnalysis?.performance?.fixRecommendations}
                    links={result.referenceLinks?.filter((l: { category: string }) => l.category === 'performance')} 
                  />

                  <MetricBlock 
                    title="SEO" 
                    score={result.seoScore ?? 0} 
                    details={
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Title Tag</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${result.seoDetails?.hasTitle ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {result.seoDetails?.hasTitle ? "Present" : "Missing"}
                          </span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Meta Description</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${result.seoDetails?.hasMetaDescription ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {result.seoDetails?.hasMetaDescription ? "Present" : "Missing"}
                          </span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">H1 Heading</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${result.seoDetails?.hasH1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {result.seoDetails?.hasH1 ? `${result.seoDetails.h1Count} found` : "Missing"}
                          </span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Total Links</span>
                          <span className="font-bold text-zinc-900">{result.seoDetails?.linksCount || 0}</span>
                        </li>
                      </ul>
                    }
                    analysis={result.aiCategoryAnalysis?.seo?.analysis}
                    fixSteps={result.aiCategoryAnalysis?.seo?.fixRecommendations}
                    links={result.referenceLinks?.filter((l: { category: string }) => l.category === 'seo')} 
                  />

                  <MetricBlock 
                    title="Accessibility" 
                    score={result.accScore ?? 0} 
                    details={
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Missing Aria Labels</span>
                          <span className="font-bold text-zinc-900">{result.accDetails?.missingAriaLabels || 0}</span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Image Alt Tags Missing</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${(result.accDetails?.imagesWithoutAlt ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {result.accDetails?.imagesWithoutAlt || 0}
                          </span>
                        </li>
                      </ul>
                    }
                    analysis={result.aiCategoryAnalysis?.accessibility?.analysis}
                    fixSteps={result.aiCategoryAnalysis?.accessibility?.fixRecommendations}
                    links={result.referenceLinks?.filter((l: { category: string }) => l.category === 'wcag')} 
                  />

                  <MetricBlock 
                    title="Security" 
                    score={result.securityScore ?? 0} 
                    details={
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">HTTPS Usage</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${result.securityDetails?.isHttps ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {result.securityDetails?.isHttps ? "Secure" : "Insecure"}
                          </span>
                        </li>
                        <li className="flex justify-between items-center py-1 border-b border-zinc-200/50 last:border-0">
                          <span className="text-zinc-500 font-medium">Cookie Security</span>
                          <span className={`font-bold px-2 py-0.5 rounded ${result.securityDetails?.cookies?.missingSecure === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {result.securityDetails?.cookies?.missingSecure === 0 ? "All Secure" : `${result.securityDetails?.cookies?.missingSecure || 0} insecure`}
                          </span>
                        </li>
                      </ul>
                    }
                    analysis={result.aiCategoryAnalysis?.security?.analysis}
                    fixSteps={result.aiCategoryAnalysis?.security?.fixRecommendations}
                    links={result.referenceLinks?.filter((l: { category: string }) => l.category === 'security')} 
                  />
                </section>

                <AiSummarySection aiSummary={result.aiSummary} />
                {(!result.aiSummary && liveStatus === 'analyzed') && (
                  <div className="flex items-center justify-center p-8 mt-4 bg-zinc-50 rounded-2xl border border-zinc-200/50 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
                      <span className="font-medium text-sm">AI is summarizing the results...</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-center mt-12 gap-4">
                  <Link href={`/report/${activeAuditId}`}>
                    <Button variant="outline" className="px-8 py-4 font-semibold text-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl shadow-sm transition-all hover:scale-105">
                      Xem Chi Tiết Báo Cáo
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

