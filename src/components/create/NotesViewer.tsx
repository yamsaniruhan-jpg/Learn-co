import React, { useState } from 'react';
import { NotesContent } from '../../types/creator';
import { BookOpen, FunctionSquare, Layers, Eye, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { FormattedMathText, cleanLatexToNormalText } from '../common/FormattedMathText';
import { latexToPlainText } from '../../utils/textSanitizer';

interface NotesViewerProps {
  notes: NotesContent;
  title?: string;
  defaultReaderMode?: 'normal' | 'typeset';
}

export const NotesViewer: React.FC<NotesViewerProps> = ({
  notes,
  title,
  defaultReaderMode = 'normal',
}) => {
  const [readerMode, setReaderMode] = useState<'normal' | 'typeset'>(defaultReaderMode);

  if (!notes) {
    return <div className="p-8 text-center text-slate-400 text-sm">No lecture notes found.</div>;
  }

  const renderMathContent = (content: string) => {
    if (readerMode === 'normal') {
      return latexToPlainText(content);
    }
    return <FormattedMathText text={content} />;
  };

  const renderFormulaBlock = (formula: string) => {
    if (readerMode === 'normal') {
      return (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-semibold text-indigo-950 dark:text-indigo-200 text-center font-sans shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-500 block uppercase tracking-wider mb-0.5">
            Equation (Reader Format)
          </span>
          {cleanLatexToNormalText(formula)}
        </div>
      );
    }

    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-center">
        <FormattedMathText text={`$$${formula.replace(/^\$\$|\$\$/g, '')}$$`} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Reader Mode Toggle Bar */}
      <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              STRUCTURED LECTURE COMPENDIUM
            </Badge>
          </div>

          {/* Reader Mode Format Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold select-none">
            <button
              onClick={() => setReaderMode('normal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px] ${
                readerMode === 'normal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Normal Reader Mode: Human-readable plain text without raw LaTeX syntax"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Normal Reader Mode</span>
            </button>
            <button
              onClick={() => setReaderMode('typeset')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px] ${
                readerMode === 'typeset'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Typeset Mode: Formatted TeX typography"
            >
              <FunctionSquare className="w-3.5 h-3.5" />
              <span>LaTeX Typeset</span>
            </button>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          {notes.title || title || 'Analytical Lecture Notes'}
        </h2>
        {notes.overview && (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {renderMathContent(notes.overview)}
          </div>
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
                <span>{renderMathContent(section.heading)}</span>
              </h3>

              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-normal">
                {section.markdownContent.split('\n\n').map((para, pIdx) => (
                  <div key={pIdx}>{renderMathContent(para)}</div>
                ))}
              </div>

              {section.formulas && section.formulas.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Governing Equations ({readerMode === 'normal' ? 'Reader Format' : 'LaTeX Typeset'})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.formulas.map((f, fIdx) => (
                      <React.Fragment key={fIdx}>
                        {renderFormulaBlock(f)}
                      </React.Fragment>
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
                  {renderMathContent(d.name)}
                </h5>
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium list-decimal list-inside">
                  {d.steps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed pl-1">
                      {renderMathContent(step)}
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
