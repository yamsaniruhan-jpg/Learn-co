import React, { useState } from 'react';
import { KeyConceptItem } from '../../types/creator';
import { Key, Sparkles, BookOpenCheck, Eye, FunctionSquare } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { FormattedMathText, cleanLatexToNormalText } from '../common/FormattedMathText';
import { latexToPlainText } from '../../utils/textSanitizer';

interface KeyConceptsViewerProps {
  keyConcepts: KeyConceptItem[];
  title?: string;
  defaultReaderMode?: 'normal' | 'typeset';
}

export const KeyConceptsViewer: React.FC<KeyConceptsViewerProps> = ({
  keyConcepts,
  title,
  defaultReaderMode = 'normal',
}) => {
  const [readerMode, setReaderMode] = useState<'normal' | 'typeset'>(defaultReaderMode);

  if (!keyConcepts || keyConcepts.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-sm">No key concepts found.</div>;
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
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-950 dark:text-indigo-200 text-center font-sans">
          <span className="text-[10px] font-bold text-indigo-500 block uppercase tracking-wider mb-0.5">
            Formula (Normal Reader Mode)
          </span>
          {cleanLatexToNormalText(formula)}
        </div>
      );
    }

    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center">
        <FormattedMathText text={`$$${formula.replace(/^\$\$|\$\$/g, '')}$$`} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {keyConcepts.length} KEY INVARIANTS & GLOSSARY
          </Badge>
        </div>

        {/* Mode Toggle */}
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
              {renderMathContent(item.concept)}
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {renderMathContent(item.definition)}
            </div>

            {item.formula && renderFormulaBlock(item.formula)}

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              {item.invariant && (
                <div className="text-indigo-900 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-md">
                  <strong>Conservation Rule:</strong> {renderMathContent(item.invariant)}
                </div>
              )}
              {item.example && (
                <div className="text-slate-500 dark:text-slate-400">
                  <strong>Example:</strong> {renderMathContent(item.example)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
