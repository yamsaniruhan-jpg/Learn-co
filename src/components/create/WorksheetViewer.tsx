import React, { useState } from 'react';
import { WorksheetContent } from '../../types/creator';
import {
  ClipboardList,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface WorksheetViewerProps {
  worksheet: WorksheetContent;
  title?: string;
}

export const WorksheetViewer: React.FC<WorksheetViewerProps> = ({ worksheet, title }) => {
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  if (!worksheet || !worksheet.problems || worksheet.problems.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-sm">No worksheet problems found.</div>;
  }

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHint = (id: string) => {
    setRevealedHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalPoints = worksheet.problems.reduce((sum, p) => sum + (p.rubricScore || 10), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="primary" size="sm">
            PRACTICE WORKSHEET • {totalPoints} TOTAL PTS
          </Badge>
          <Badge variant="default" size="sm">
            {worksheet.difficulty || 'medium'}
          </Badge>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {worksheet.title || title || 'Problem-Solving Worksheet'}
        </h2>
        {worksheet.instructions && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {worksheet.instructions}
          </p>
        )}
      </div>

      {/* Problems List */}
      <div className="space-y-6">
        {worksheet.problems.map((problem) => {
          const showSol = !!revealedSolutions[problem.id];
          const showHnt = !!revealedHints[problem.id];

          return (
            <div
              key={problem.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  Problem {problem.problemNumber}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {problem.rubricScore || 10} Points
                </span>
              </div>

              {/* Problem statement */}
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                {problem.problemStatement}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {problem.hints && problem.hints.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleHint(problem.id)}
                    leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    {showHnt ? 'Hide Hint' : 'Show Hint'}
                  </Button>
                )}

                <Button
                  variant={showSol ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleSolution(problem.id)}
                  leftIcon={showSol ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {showSol ? 'Hide Full Solution' : 'Reveal Solution & Rubric'}
                </Button>
              </div>

              {/* Hint Box */}
              {showHnt && problem.hints && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <strong>Socratic Hint:</strong>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {problem.hints.map((h, hIdx) => (
                      <li key={hIdx}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verified Solution Steps & Boxed Final Answer */}
              {showSol && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-3 animate-in fade-in duration-150">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Step-by-Step Derivation:</span>
                  </div>

                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                    {problem.solutionSteps.map((step, sIdx) => (
                      <li key={sIdx} className="leading-relaxed pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">
                    <strong>Final Answer:</strong> {problem.finalAnswer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
