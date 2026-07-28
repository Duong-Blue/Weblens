'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/features/audit/hooks/useSocket';
import { AuditResult } from '@/types/audit';

type LiveDataType = Partial<AuditResult> & { error?: string };
import { useCreateAuditMutation, useLazyGetAuditResultQuery } from '@/services/api/auditApi';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ScoreCard = ({ title, score }: { title: string, score: number }) => {
  let color = 'text-emerald-700 bg-emerald-50/50 border-emerald-200/60 shadow-sm';
  if (score < 50) color = 'text-rose-700 bg-rose-50/50 border-rose-200/60 shadow-sm';
  else if (score < 90) color = 'text-amber-700 bg-amber-50/50 border-amber-200/60 shadow-sm';

  return (
    <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-transform hover:scale-[1.02] ${color}`}>
      <span className="text-xs font-semibold opacity-80 uppercase tracking-widest">{title}</span>
      <span className="text-4xl font-bold tracking-tight">{score}</span>
    </div>
  );
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socket = useSocket(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
  
  const [url, setUrl] = useState('');
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  
  useEffect(() => {
    const idFromUrl = searchParams.get('auditId');
    if (idFromUrl && !activeAuditId) {
      setTimeout(() => setActiveAuditId(idFromUrl), 0);
    }
  }, [searchParams, activeAuditId]);
  const [liveData, setLiveData] = useState<LiveDataType | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>('');

  const [createAudit, { isLoading: isCreating }] = useCreateAuditMutation();
  const [triggerGetAudit, { data: auditData, isFetching: isPolling }] = useLazyGetAuditResultQuery();

  useEffect(() => {
    if (socket && activeAuditId) {
      socket.on(`audit-progress-${activeAuditId}`, (payload: { step: string; data?: Partial<AuditResult> & { errorMessage?: string } }) => {
        setLiveStatus(payload.step);
        
        if (payload.step === 'analyzed') {
           setLiveData((prev: LiveDataType | null) => ({ ...prev, ...payload.data }));
        }
        
        if (payload.step === 'summarized') {
           setLiveData((prev: LiveDataType | null) => ({ ...prev, aiSummary: payload.data?.aiSummary }));
        }
        
        if (payload.step === 'completed' && payload.data) {
           setLiveData(payload.data);
           setLiveStatus('completed');
        }

        if (payload.step === 'failed') {
           setLiveStatus('failed');
           setLiveData((prev: LiveDataType | null) => ({ ...prev, error: payload.data?.errorMessage }));
        }
      });
    }

    return () => {
      if (socket && activeAuditId) {
        socket.off(`audit-progress-${activeAuditId}`);
      }
    };
  }, [socket, activeAuditId]);

  const status = liveStatus || auditData?.data?.audit?.status;
  const result = liveData || auditData?.data?.result;
  const isAuditRunning = status === 'pending' || status === 'processing' || status === 'crawling' || status === 'analyzed' || status === 'summarized';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeAuditId && isAuditRunning) {
      interval = setInterval(() => {
        triggerGetAudit(activeAuditId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeAuditId, isAuditRunning, triggerGetAudit]);

  // For testing purposes: listen for custom event to force poll
  useEffect(() => {
    const handleForcePoll = () => {
      if (activeAuditId) {
        triggerGetAudit(activeAuditId);
      }
    };
    window.addEventListener('test-trigger-poll', handleForcePoll);
    return () => window.removeEventListener('test-trigger-poll', handleForcePoll);
  }, [activeAuditId, triggerGetAudit]);

  const handleStartAudit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;
    
    let submitUrl = url.trim();
    if (!submitUrl.startsWith('http://') && !submitUrl.startsWith('https://')) {
      submitUrl = 'https://' + submitUrl;
    }

    setActiveAuditId(null);
    setLiveData(null);
    setLiveStatus('');

    createAudit({ url: submitUrl, anonymous: true })
        .unwrap()
        .then((res: { data?: { audit?: { id?: string } } }) => {
        if (res?.data?.audit?.id) {
            setActiveAuditId(res.data.audit.id);
            setLiveStatus('pending');
        }
        });
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-12 font-sans flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">WebLens</h1>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-sm text-zinc-600 hidden sm:block">
                <span className="font-medium">Anonymous</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 w-full flex-1">
        
        <Card className="p-8 border-zinc-200/60 shadow-lg shadow-zinc-200/40 bg-white/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <h2 className="text-xl font-semibold text-zinc-900 mb-6 tracking-tight">Start New Audit</h2>
          <form onSubmit={handleStartAudit} className="flex flex-col sm:flex-row gap-4">
            <Input 
              type="text" 
              placeholder="https://example.com" 
              className="flex-1 text-lg py-6 bg-white shadow-sm border-zinc-200"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCreating || isAuditRunning}
            />
            <Button 
              type="submit"
              disabled={!url || isCreating || isAuditRunning}
              className="px-10 text-lg h-auto shadow-sm font-semibold transition-all hover:scale-[1.02]"
            >
              {isCreating || isAuditRunning ? 'Analyzing...' : 'Audit Now'}
            </Button>
          </form>
        </Card>

        {activeAuditId && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
            <Card className="p-8 border-zinc-200/60 shadow-lg shadow-zinc-200/40 bg-white/50 backdrop-blur-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-zinc-100 pb-6">
                <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
                  Report for: 
                  <span className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-md font-medium text-base ml-1">
                    {auditData?.data?.audit?.url || url}
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest hidden sm:inline-block">Status</span>
                  <Badge variant={status === 'completed' ? 'success' : status === 'failed' ? 'warning' : 'info'} className={status !== 'completed' && status !== 'failed' ? 'animate-pulse py-1 px-3' : 'py-1 px-3'}>
                    {status || 'initializing'}
                  </Badge>
                </div>
              </div>

              {isAuditRunning && !result && (
                <div className="p-8 sm:p-12 space-y-12">
                  <div className="flex items-center gap-4 text-blue-700 mb-6 bg-blue-50/80 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="font-semibold text-lg">
                      {status === 'crawling' ? 'Step 1: Crawling the website...' : 
                       status === 'analyzed' ? 'Step 2: Performing AI Analysis...' : 
                       'Preparing audit...'}
                    </span>
                  </div>
                  
                  <section>
                    <div className="h-7 w-32 bg-zinc-200/60 rounded-md animate-pulse mb-6"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-6 rounded-2xl border border-zinc-100 bg-white/60 shadow-sm flex flex-col items-center justify-center gap-3 animate-pulse">
                          <div className="h-4 w-20 bg-zinc-200/60 rounded"></div>
                          <div className="h-10 w-16 bg-zinc-200/60 rounded mt-1"></div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white/60 p-8 rounded-2xl shadow-sm border border-zinc-100">
                    <div className="h-7 w-64 bg-zinc-200/60 rounded-md animate-pulse mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-zinc-200/60 rounded animate-pulse"></div>
                      <div className="h-4 w-[92%] bg-zinc-200/60 rounded animate-pulse"></div>
                      <div className="h-4 w-[96%] bg-zinc-200/60 rounded animate-pulse"></div>
                      <div className="h-4 w-[85%] bg-zinc-200/60 rounded animate-pulse"></div>
                    </div>
                  </section>
                </div>
              )}

              {status === 'failed' && (
                <div className="p-12 text-center border border-rose-100 bg-rose-50 flex flex-col items-center justify-center gap-4 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <span className="font-bold text-xl text-rose-700">Failed to perform audit</span>
                  <span className="text-rose-600/80 max-w-md">
                    {liveData?.error?.includes("ERR_NAME_NOT_RESOLVED") || auditData?.data?.result?.error?.includes("ERR_NAME_NOT_RESOLVED")
                      ? "The domain name could not be resolved. Please check if the URL is correct and try again."
                      : "Please check the URL and try again. The server might be unreachable or the website doesn't exist."}
                  </span>
                </div>
              )}
            </Card>

            {result && (
              <>
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                  <h2 className="text-xl font-bold text-zinc-900 mb-6 tracking-tight">Core Vitals</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ScoreCard title="Performance" score={result?.perfScore || 0} />
                    <ScoreCard title="SEO" score={result?.seoScore || 0} />
                    <ScoreCard title="Accessibility" score={result?.accScore || 0} />
                    <ScoreCard title="Security" score={result?.securityScore || 0} />
                  </div>
                </section>

                <Card className="p-8 border-zinc-200/60 shadow-lg shadow-zinc-200/40 bg-white/50 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3 tracking-tight">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl shadow-sm border border-blue-100">✨</div> 
                    AI Insights & Recommendations
                  </h2>
                  <div className="prose prose-zinc prose-lg max-w-none text-zinc-600">
                    {result?.aiSummary ? (
                      <ReactMarkdown>{result.aiSummary}</ReactMarkdown>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-4 text-zinc-500">
                        <div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-base font-medium animate-pulse">WebLens AI is generating the summary...</span>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="p-8 border-zinc-200/60 shadow-lg shadow-zinc-200/40 bg-white/50 backdrop-blur-sm overflow-hidden">
                    <h3 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">Tech Stack & Network</h3>
                    <pre className="bg-zinc-900 p-5 rounded-xl text-sm overflow-x-auto text-zinc-300 h-72 shadow-inner font-mono">
                      {JSON.stringify({
                        techStack: result?.techStack,
                        networkDetails: result?.networkDetails
                      }, null, 2)}
                    </pre>
                  </Card>

                  <Card className="p-8 border-zinc-200/60 shadow-lg shadow-zinc-200/40 bg-white/50 backdrop-blur-sm overflow-hidden">
                    <h3 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">Structure & Errors</h3>
                    <pre className="bg-zinc-900 p-5 rounded-xl text-sm overflow-x-auto text-zinc-300 h-72 shadow-inner font-mono">
                      {JSON.stringify({
                        structureDetails: result?.structureDetails,
                        jsErrorsDetails: result?.jsErrorsDetails
                      }, null, 2)}
                    </pre>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
