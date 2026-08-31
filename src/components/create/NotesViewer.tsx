import React from 'react';
import { NotesContent } from '../../types/creator';
import { BookOpen, FunctionSquare, Layers } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface NotesViewerProps {
  notes: NotesContent;
  title?: string;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({ notes, title }) => {
  if (!notes) {
    return <div className="p-8 text-center text-slate-400 text-sm">No lecture notes found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Title and Overview */}
      <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            STRUCTURED LECTURE COMPENDIUM
          </Badge>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          {notes.title || title || 'Analytical Lecture Notes'}
        </h2>
        {notes.overview && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {notes.overview}
          </p>
        )}
      </div>

      {/* Sections */}
      {notes.sections && notes.sections.length > 0 && (
        <div className="space-y-6">
          {notes.sections.map((section, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span>{section.heading}</span>
              </h3>

              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-normal">
                {section.markdownContent.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>

              {section.formulas && section.formulas.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Governing Equations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.formulas.map((f, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 text-center"
                      >
                        $${f}$$
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step-by-Step Derivations */}
      {notes.keyDerivations && notes.keyDerivations.length > 0 && (
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <FunctionSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Formal Mathematical Derivations</span>
          </h4>

          <div className="space-y-4">
            {notes.keyDerivations.map((d, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3"
              >
                <h5 className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200">
                  {d.name}
                </h5>
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium list-decimal list-inside">
                  {d.steps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
