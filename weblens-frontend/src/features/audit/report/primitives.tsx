import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ScoreGauge
interface ScoreGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreGauge = React.forwardRef<HTMLDivElement, ScoreGaugeProps>(
  ({ score, size = 64, strokeWidth = 6, className, ...props }, ref) => {
    // 0-49: Red, 50-89: Orange, 90-100: Green
    let colorClass = 'text-red-500';
    if (score >= 90) colorClass = 'text-green-500';
    else if (score >= 50) colorClass = 'text-orange-500';

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const dashoffset = circumference - (score / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          className="transform -rotate-90 w-full h-full"
          style={{ printColorAdjust: 'exact' }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-gray-200 fill-transparent"
          />
          {/* Foreground circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            className={cn('fill-transparent transition-all duration-500', colorClass)}
            stroke="currentColor"
          />
        </svg>
        <div className={cn('absolute inset-0 flex items-center justify-center font-bold', colorClass)} style={{ fontSize: size * 0.35 }}>
          {score}
        </div>
      </div>
    );
  }
);
ScoreGauge.displayName = 'ScoreGauge';

// ReportSection
interface ReportSectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  number?: string | number;
  pageBreak?: boolean;
}

const ReportSection = React.forwardRef<HTMLElement, ReportSectionProps>(
  ({ title, number, pageBreak, className, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          'break-inside-avoid mb-8 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden', 
          pageBreak && 'report-page-break',
          className
        )}
        data-report-section={number}
        {...props}
      >
        <div className="bg-gray-50 border-b border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            {number && (
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">
                {number}
              </span>
            )}
            {number && `${number}. `}{title}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </section>
    );
  }
);
ReportSection.displayName = 'ReportSection';

// StatusPill
export type StatusType = 'Pass' | 'Fail' | 'Warning' | 'Info';

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, className, ...props }, ref) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (status === 'Pass') colorClass = 'bg-green-100 text-green-800 border-green-200';
    if (status === 'Fail') colorClass = 'bg-red-100 text-red-800 border-red-200';
    if (status === 'Warning') colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
    if (status === 'Info') colorClass = 'bg-blue-100 text-blue-800 border-blue-200';

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', colorClass, className)}
        style={{ printColorAdjust: 'exact' }}
        {...props}
      >
        {status}
      </span>
    );
  }
);
StatusPill.displayName = 'StatusPill';

// CriteriaChecklist
export interface CriteriaItem {
  id: string;
  label: string;
  passed: boolean;
}

interface CriteriaChecklistProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CriteriaItem[];
}

const CriteriaChecklist = React.forwardRef<HTMLUListElement, CriteriaChecklistProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <ul ref={ref} className={cn('space-y-3', className)} {...props}>
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100 break-inside-avoid">
            <div className="mt-0.5 flex-shrink-0" style={{ printColorAdjust: 'exact' }}>
              {item.passed ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={cn('text-sm font-medium', item.passed ? 'text-gray-700' : 'text-gray-900')}>{item.label}</span>
          </li>
        ))}
      </ul>
    );
  }
);
CriteriaChecklist.displayName = 'CriteriaChecklist';

// InfoRow
interface InfoRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
}

const InfoRow = React.forwardRef<HTMLDivElement, InfoRowProps>(
  ({ label, value, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-0 gap-1 sm:gap-4', className)} {...props}>
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{label}</span>
        <span className="text-sm text-gray-900 font-semibold break-words text-left sm:text-right">
          {value !== null && value !== undefined ? value : <span className="text-gray-400 italic">N/A</span>}
        </span>
      </div>
    );
  }
);
InfoRow.displayName = 'InfoRow';

// ScoreTable
export interface ScoreTableItem {
  label: string;
  score?: number;
}

interface ScoreTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows: ScoreTableItem[];
}

const ScoreTable = React.forwardRef<HTMLDivElement, ScoreTableProps>(
  ({ rows, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)} {...props}>
        {rows.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 break-inside-avoid">
            <span className="font-semibold text-gray-700">{item.label}</span>
            {item.score !== undefined ? (
              <ScoreGauge score={item.score} size={48} strokeWidth={4} />
            ) : (
              <span className="text-gray-400 font-medium">—</span>
            )}
          </div>
        ))}
      </div>
    );
  }
);
ScoreTable.displayName = 'ScoreTable';

// KeyValueGrid
interface KeyValueGridProps extends React.HTMLAttributes<HTMLDivElement> {
  items: { label: string; value: React.ReactNode }[];
}

const KeyValueGrid = React.forwardRef<HTMLDivElement, KeyValueGridProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)} {...props}>
        {items.map((item, idx) => (
          <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 break-inside-avoid">
            <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">{item.label}</div>
            <div className="text-sm font-semibold text-gray-900 truncate" title={typeof item.value === 'string' ? item.value : undefined}>
              {item.value !== null && item.value !== undefined ? item.value : <span className="text-gray-400 italic">N/A</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
KeyValueGrid.displayName = 'KeyValueGrid';

// KnowledgeLink
interface KnowledgeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  slug: string;
  title?: string;
}

const KnowledgeLink = React.forwardRef<HTMLAnchorElement, KnowledgeLinkProps>(
  ({ slug, title, className, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={`/knowledge/${slug}`}
        className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline print:hidden transition-colors', className)}
        {...props}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {children || title || 'Learn more'}
      </Link>
    );
  }
);
KnowledgeLink.displayName = 'KnowledgeLink';

export {
  ScoreGauge,
  ReportSection,
  StatusPill,
  CriteriaChecklist,
  InfoRow,
  ScoreTable,
  KeyValueGrid,
  KnowledgeLink,
};