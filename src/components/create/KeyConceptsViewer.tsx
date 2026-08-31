import React from 'react';
import { KeyConceptItem } from '../../types/creator';
import { Key, Sparkles, BookOpenCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface KeyConceptsViewerProps {
  keyConcepts: KeyConceptItem[];
  title?: string;
}

export const KeyConceptsViewer: React.FC<KeyConceptsViewerProps> = ({
  keyConcepts,
  title,
}) => {
  if (!keyConcepts || keyConcepts.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-sm">No key concepts found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {keyConcepts.length} KEY INVARIANTS & GLOSSARY
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keyConcepts.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                Invariant {idx + 1}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {item.concept}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.definition}
            </p>

            {item.formula && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 text-center">
                $${item.formula}$$
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              {item.invariant && (
                <div className="text-indigo-900 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-md">
                  <strong>Conservation Rule:</strong> {item.invariant}
                </div>
              )}
              {item.example && (
                <div className="text-slate-500 dark:text-slate-400">
                  <strong>Example:</strong> {item.example}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
