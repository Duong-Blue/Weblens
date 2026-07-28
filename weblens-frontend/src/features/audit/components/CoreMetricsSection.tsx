import React from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { AuditResult } from "@/types/audit";

const getScoreColor = (score: number) => {
  if (score >= 90) return { text: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", ring: "ring-emerald-500/20", fill: "#059669", track: "#d1fae5" };
  if (score >= 50) return { text: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100", ring: "ring-amber-500/20", fill: "#d97706", track: "#fef3c7" };
  return { text: "text-rose-600", bg: "bg-rose-50/50", border: "border-rose-100", ring: "ring-rose-500/20", fill: "#e11d48", track: "#ffe4e6" };
};

export const ScoreCard = ({ title, score }: { title: string, score: number }) => {
  const colors = getScoreColor(score);
  const data = [{ name: "Score", value: score }];

  return (
    <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center transition-all hover:shadow-md ring-1 ring-inset ${colors.text} ${colors.bg} ${colors.border} ${colors.ring}`}>
      <span className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-70">{title}</span>
      <div className="relative w-28 h-28 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: colors.track }}
              dataKey="value"
              cornerRadius={10}
              fill={colors.fill}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold tracking-tight">{score}</span>
        </div>
      </div>
    </div>
  );
};

export const CoreMetricsSection = ({ result }: { result: Partial<AuditResult> }) => {
  if (result?.perfScore === undefined) return null;
  return (
    <section>
      <h3 className="text-lg font-semibold text-zinc-900 mb-6">Core Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <ScoreCard title="Performance" score={result.perfScore ?? 0} />
        <ScoreCard title="SEO" score={result.seoScore ?? 0} />
        <ScoreCard title="Accessibility" score={result.accScore ?? 0} />
        <ScoreCard title="Security" score={result.securityScore ?? 0} />
      </div>
    </section>
  );
};
