import React from "react";
import { TechStack, TechItem } from "@/types/audit";

export const TechStackSection = ({ techStack }: { techStack: TechStack | null | undefined }) => {
  if (!techStack) return null;
  return (
    <section>
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Technology Stack</h3>
      <div className="flex flex-wrap gap-2.5">
        {techStack?.frameworks && techStack.frameworks.length > 0 ? (
          techStack.frameworks.map((tech: TechItem, idx: number) => (
            <span key={idx} className="px-3.5 py-1.5 bg-white border border-zinc-200/80 text-zinc-700 rounded-lg text-sm font-medium shadow-sm hover:border-zinc-300 transition-colors">
              {tech.name}
            </span>
          ))
        ) : (
          <span className="text-sm text-zinc-400 italic">No frameworks detected</span>
        )}
        {techStack?.analytics?.map((tech: TechItem, idx: number) => (
          <span key={idx} className="px-3.5 py-1.5 bg-indigo-50/50 border border-indigo-100/80 text-indigo-700 rounded-lg text-sm font-medium shadow-sm hover:border-indigo-200 transition-colors">
            {tech.name}
          </span>
        ))}
      </div>
    </section>
  );
};
