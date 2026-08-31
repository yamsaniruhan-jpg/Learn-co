import React, { useState } from 'react';
import { SummaryContent } from '../../types/creator';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SummaryViewerProps {
  summary: SummaryContent;
  title?: string;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({ summary, title }) => {
  const [expandedTheorems, setExpandedTheorems] = useState<Record<number, boolean>>({
    0: true,
  });

  if (!summary) {
    return <div className="p-8 text-center text-slate-400 text-sm">No summary content found.</div>;
  }

  const toggleTheorem = (idx: number) => {
    setExpandedTheorems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/20 dark:from-indigo-950/20 dark:via-slate-900 dark:to-indigo-950/10 space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Executive Synthesis & Core Principles
          </h3>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          {summary.executiveSummary.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Theorems and Principles Accordion */}
      {summary.theoremsAndPrinciples && summary.theoremsAndPrinciples.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Foundational Theorems & Governing Laws ({summary.theoremsAndPrinciples.length})
            </h4>
          </div>

          <div className="space-y-3">
            {summary.theoremsAndPrinciples.map((theorem, idx) => {
              const isExpanded = !!expandedTheorems[idx];
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all space-y-3"
                >
                  <div
                    onClick={() => toggleTheorem(idx)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {theorem.name}
                      </h5>
                    </div>
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                      <p className="leading-relaxed font-medium">{theorem.statement}</p>

                      {theorem.formula && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          $${theorem.formula}$$
                        </div>
                      )}

                      {theorem.significance && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>Pedagogical Significance:</strong> {theorem.significance}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Common Misconceptions & Corrections Grid */}
      {summary.misconceptions && summary.misconceptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Diagnostic Pitfalls & Ground-Truth Corrections
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.misconceptions.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      Frequent Misconception
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {m.misconception}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      First-Principles Correction
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {m.correction}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Takeaways */}
      {summary.actionableTakeaways && summary.actionableTakeaways.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <ListChecks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Mastery Next Steps</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {summary.actionableTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
