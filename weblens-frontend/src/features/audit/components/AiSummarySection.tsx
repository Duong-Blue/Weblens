import React, { useMemo } from "react";

interface Recommendation {
  priority: string;
  area: string;
  action: string;
  impact: string;
}

interface ParsedSummary {
  executiveSummary?: string;
  uiUxAnalysis?: string | object;
  recommendations?: Recommendation[];
}

export const AiSummarySection = ({ aiSummary }: { aiSummary?: string | null }) => {
  const { isJson, parsedData } = useMemo(() => {
    if (!aiSummary) return { isJson: false, parsedData: null };
    if (typeof aiSummary === 'object') return { isJson: true, parsedData: aiSummary as ParsedSummary };
    try {
      const parsed = JSON.parse(aiSummary as string);
      // Optional check if it's an object with our expected fields
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        (parsed.executiveSummary || parsed.uiUxAnalysis || parsed.recommendations)
      ) {
        return { isJson: true, parsedData: parsed as ParsedSummary };
      }
      return { isJson: false, parsedData: null };
    } catch {
      return { isJson: false, parsedData: null };
    }
  }, [aiSummary]);

  const getPriorityBadgeStyles = (priority: string = "") => {
    const p = priority.toLowerCase();
    if (p.includes("high")) return "bg-red-100 text-red-700 border-red-200";
    if (p.includes("medium")) return "bg-amber-100 text-amber-700 border-amber-200";
    if (p.includes("low")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-blue-100 text-blue-700 border-blue-200"; // fallback
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-8 border border-blue-100/60 shadow-sm backdrop-blur-sm">
      <div className="absolute top-0 right-0 p-32 bg-blue-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <h3 className="text-xl font-semibold text-blue-900 mb-6 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-blue-100/80 rounded-lg">
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        AI Executive Summary
      </h3>

      {aiSummary ? (
        <div className="relative z-10">
          {isJson && parsedData ? (
            <div className="space-y-8">
              {/* Executive Summary */}
              {parsedData.executiveSummary && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-800/80 mb-3">
                    Executive Summary
                  </h4>
                  <p className="text-zinc-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {parsedData.executiveSummary}
                  </p>
                </div>
              )}

              {/* UI/UX Analysis */}
              {parsedData.uiUxAnalysis && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-800/80 mb-3">
                    UI/UX Analysis
                  </h4>
                  <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-[15px] bg-white/60 p-5 rounded-xl border border-blue-100/60 shadow-sm">
                    {typeof parsedData.uiUxAnalysis === "string"
                      ? parsedData.uiUxAnalysis
                      : JSON.stringify(parsedData.uiUxAnalysis, null, 2)}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {parsedData.recommendations && parsedData.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-800/80 mb-4">
                    Actionable Recommendations
                  </h4>
                  <div className="grid gap-4">
                    {parsedData.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-white/80 p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h5 className="font-semibold text-zinc-900 text-base">{rec.action}</h5>
                          {rec.priority && (
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap uppercase tracking-wide ${getPriorityBadgeStyles(
                                rec.priority
                              )}`}
                            >
                              {rec.priority}
                            </span>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm bg-blue-50/50 p-4 rounded-lg border border-blue-50 mt-2">
                          <div>
                            <span className="text-zinc-500 font-medium block mb-1 uppercase text-xs tracking-wider">Area</span>
                            <span className="font-semibold text-zinc-700">{rec.area || "General"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-medium block mb-1 uppercase text-xs tracking-wider">Expected Impact</span>
                            <span className="font-semibold text-zinc-700">{rec.impact || "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Fallback for plain text markdown
            <div className="prose prose-zinc prose-blue max-w-none">
              <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                {typeof aiSummary === 'string' ? aiSummary : JSON.stringify(aiSummary, null, 2)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 flex flex-col gap-3 pt-2">
          <div className="w-full h-4 animate-pulse bg-blue-200/50 rounded-md"></div>
          <div className="w-[90%] h-4 animate-pulse bg-blue-200/50 rounded-md"></div>
          <div className="w-[85%] h-4 animate-pulse bg-blue-200/50 rounded-md"></div>
          <div className="w-[60%] h-4 animate-pulse bg-blue-200/50 rounded-md"></div>

          <div className="flex items-center gap-3 mt-4 text-blue-600/70">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Generating AI insights...</span>
          </div>
        </div>
      )}
    </section>
  );
};
