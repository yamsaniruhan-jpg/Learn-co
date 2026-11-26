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
  averageMastery?: number;
  activeStreak?: number;
  onAskCopilot: (prompt: string) => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  isOpen,
  onClose,
  activeContextTitle = 'General Learning Space',
  activeSubject,
  averageMastery = 0,
  activeStreak = 0,
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
      className="w-80 xl:w-88 border-l border-[#E3DFF5] dark:border-[#232329] bg-[#FFFFFF] dark:bg-[#111114] flex flex-col shrink-0 h-full overflow-hidden transition-all duration-200"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-[#E3DFF5] dark:border-[#232329] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F4F4F6] uppercase tracking-wider font-mono">
              Study Companion
            </h3>
            <p className="text-[11px] text-[#6B6890] dark:text-[#9E9EA9] truncate max-w-[170px] font-medium">
              {activeContextTitle}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#6B6890] hover:text-[#2D2A4A] dark:text-[#9E9EA9] dark:hover:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] transition-colors cursor-pointer"
          aria-label="Close companion panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Invariant & Socratic Guide */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Active Context Card */}
        <div className="p-3.5 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] space-y-2">
          <div className="flex items-center gap-1.5 text-[#6C5CE7] dark:text-[#CCFF00] font-bold">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Active Focus Invariants</span>
          </div>
          <p className="text-[#6B6890] dark:text-[#9E9EA9] text-[11px] leading-relaxed">
            Always verify boundary limits and check first-derivative critical points before establishing monotonicity.
          </p>
        </div>

        {/* Quick Socratic Prompts */}
        <div>
          <h4 className="micro text-[#6B6890] dark:text-[#9E9EA9] mb-2">
            Quick Socratic Actions
          </h4>
          <div className="space-y-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onAskCopilot(prompt)}
                className="w-full text-left p-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#16161C] border border-[#E3DFF5] dark:border-[#232329] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/60 text-[#2D2A4A] dark:text-[#F4F4F6] text-[11px] font-medium transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate mr-1">{prompt}</span>
                <ChevronRight className="w-3 h-3 text-[#6B6890] dark:text-[#71717A] group-hover:text-[#6C5CE7] dark:group-hover:text-[#CCFF00] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Cognitive Retention Mini Widget */}
        <div className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[#2D2A4A] dark:text-[#F4F4F6] text-[11px]">
              Memory Stability{activeSubject ? ` (${activeSubject.toUpperCase()})` : ''}
            </span>
            <span className="text-[11px] font-mono font-extrabold text-[#6C5CE7] dark:text-[#CCFF00]">
              {averageMastery}%
            </span>
          </div>
          <div className="w-full bg-[#E3DFF5] dark:bg-[#232329] rounded-full h-1.5">
            <div
              className="bg-[#6C5CE7] dark:bg-[#CCFF00] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, averageMastery))}%` }}
            />
          </div>
          <p className="text-[10px] text-[#6B6890] dark:text-[#9E9EA9] mt-1.5">
            {averageMastery > 0
              ? `Current streak: ${activeStreak} day${activeStreak === 1 ? '' : 's'} · Calibrated from practice attempts.`
              : 'Complete a diagnostic practice session to calibrate memory stability.'}
          </p>
        </div>
      </div>

      {/* Instant Copilot Input Bar */}
      <div className="p-3 border-t border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B]">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask quick Socratic question..."
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] rounded-lg px-3 py-2 text-xs text-[#2D2A4A] dark:text-[#F4F4F6] placeholder:text-[#8E8BAF] dark:placeholder:text-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#CCFF00] pr-9"
          />
          <button
            type="submit"
            disabled={!quickQuestion.trim()}
            className="absolute right-2 p-1 text-[#6C5CE7] dark:text-[#CCFF00] disabled:opacity-40 hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] rounded-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
