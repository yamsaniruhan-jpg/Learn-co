import React, { useState } from 'react';
import { QuestionBankItem } from '../../types/curriculum';
import {
  Award,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Bot,
} from 'lucide-react';

interface QuestionReviewItem {
  question: QuestionBankItem;
  userAnswer: any;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
}

interface PracticeResultsViewProps {
  results: {
    totalQuestions: number;
    correctCount: number;
    totalXpEarned: number;
    timeSpentSeconds: number;
    questionReviews: QuestionReviewItem[];
  };
  onRestart: () => void;
  onReturnToCurriculum: () => void;
  onOpenMistakeNotebook?: () => void;
}

export const PracticeResultsView: React.FC<PracticeResultsViewProps> = ({
  results,
  onRestart,
  onReturnToCurriculum,
  onOpenMistakeNotebook,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const accuracy = Math.round((results.correctCount / Math.max(1, results.totalQuestions)) * 100);
  const avgTimePerQuestion = Math.round(results.timeSpentSeconds / Math.max(1, results.totalQuestions));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/50 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                Session Complete
              </span>
              {accuracy >= 80 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> High Mastery
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Practice Performance Scorecard</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
              <Zap className="w-5 h-5 fill-current text-amber-400" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">XP Awarded</div>
                <div className="text-lg font-mono font-bold text-amber-300">+{results.totalXpEarned} XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 font-medium mb-1">Accuracy</div>
            <div className="text-2xl font-bold font-mono text-white">{accuracy}%</div>
            <div className="text-[11px] text-slate-400 mt-1">{results.correctCount} of {results.totalQuestions} correct</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 font-medium mb-1">Total Time</div>
            <div className="text-2xl font-bold font-mono text-white">{formatTime(results.timeSpentSeconds)}</div>
            <div className="text-[11px] text-slate-400 mt-1">Full problem ladder</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 font-medium mb-1">Pace / Question</div>
            <div className="text-2xl font-bold font-mono text-white">{avgTimePerQuestion}s</div>
            <div className="text-[11px] text-slate-400 mt-1">Target: &lt; 90s</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 font-medium mb-1">Mistakes Logged</div>
            <div className="text-2xl font-bold font-mono text-rose-400">
              {results.totalQuestions - results.correctCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Sent to Mistake Notebook</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onRestart}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Launch Another Ladder</span>
          </button>

          {onOpenMistakeNotebook && results.totalQuestions - results.correctCount > 0 && (
            <button
              onClick={onOpenMistakeNotebook}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-rose-500" />
              <span>Review Mistake Notebook</span>
            </button>
          )}
        </div>

        <button
          onClick={onReturnToCurriculum}
          className="px-4 py-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Return to Curriculum</span>
        </button>
      </div>

      {/* Detailed Question Reviews */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Question-by-Question Solution Analysis ({results.questionReviews.length})
        </h3>

        {results.questionReviews.map((review, idx) => {
          const isExp = expandedQuestions[review.question.id] || false;
          return (
            <div
              key={review.question.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      review.isCorrect
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {review.question.topicId}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="capitalize">{review.question.difficulty.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{review.timeSpent}s spent</span>
                      {review.hintsUsed > 0 && (
                        <>
                          <span>•</span>
                          <span>{review.hintsUsed} hint(s) used</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                      review.isCorrect
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {review.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+5 XP)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Incorrect (0 XP)
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => toggleExpand(review.question.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm text-slate-800 dark:text-slate-200 font-serif leading-relaxed">
                {review.question.questionText}
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3 rounded-xl border ${
                    review.isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 opacity-80">
                    Your Response
                  </span>
                  <div className="font-medium">{Array.isArray(review.userAnswer) ? review.userAnswer.join(', ') : review.userAnswer?.toString() || 'None'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-slate-500">
                    Authoritative Correct Answer
                  </span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {Array.isArray(review.question.correctAnswer)
                      ? review.question.correctAnswer.join(', ')
                      : review.question.correctAnswer}
                  </div>
                </div>
              </div>

              {/* Expanded Step-by-Step Breakdown */}
              {isExp && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Explanation:</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {review.question.explanation}
                  </p>

                  {review.question.stepByStepSolution && (
                    <div className="space-y-1.5 pt-2">
                      <div className="font-bold text-slate-900 dark:text-white">Step-by-Step Invariant Derivation:</div>
                      {review.question.stepByStepSolution.map((s, sI) => (
                        <div key={sI} className="text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <span className="font-mono text-indigo-500 font-bold">{sI + 1}.</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
