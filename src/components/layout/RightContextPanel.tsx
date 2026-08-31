import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  Lightbulb,
  FileText,
  ChevronRight,
  Calculator,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface RightContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeContextTitle?: string;
  activeSubject?: string;
  onAskCopilot: (prompt: string) => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  isOpen,
  onClose,
  activeContextTitle = 'General Learning Space',
  activeSubject,
  onAskCopilot,
}) => {
  const [quickQuestion, setQuickQuestion] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    onAskCopilot(quickQuestion);
    setQuickQuestion('');
  };

  const quickPrompts = [
    'Break this down from first principles',
    'Derive the core formula step by step',
    'Give me an intuitive counter-example',
    'Generate a diagnostic check question',
  ];

  return (
    <aside
      aria-label="Context Companion Panel"
      className="w-80 xl:w-88 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex flex-col shrink-0 h-full overflow-hidden transition-all duration-200"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Study Companion
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
              {activeContextTitle}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close companion panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Invariant & Socratic Guide */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Active Context Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Active Focus Invariants</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Always verify boundary limits and check first-derivative critical points before establishing monotonicity.
          </p>
        </div>

        {/* Quick Socratic Prompts */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Socratic Actions
          </h4>
          <div className="space-y-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onAskCopilot(prompt)}
                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate mr-1">{prompt}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Cognitive Retention Mini Widget */}
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[11px]">
              Memory Stability
            </span>
            <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
              92%
            </span>
          </div>
          <div className="w-full bg-indigo-200/50 dark:bg-indigo-900/50 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full w-[92%]" />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            Projected half-life: 14 days before next interval drill.
          </p>
        </div>
      </div>

      {/* Instant Copilot Input Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask quick Socratic question..."
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-9"
          />
          <button
            type="submit"
            disabled={!quickQuestion.trim()}
            className="absolute right-2 p-1 text-indigo-600 dark:text-indigo-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
