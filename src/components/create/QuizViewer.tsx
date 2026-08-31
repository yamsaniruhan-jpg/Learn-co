import React, { useState } from 'react';
import { QuizQuestionItem } from '../../types/creator';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface QuizViewerProps {
  quiz: QuizQuestionItem[];
  title?: string;
  onComplete?: (score: number, total: number) => void;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ quiz, title, onComplete }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No quiz questions found.
      </div>
    );
  }

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    // Auto-reveal explanation upon picking in practice mode
    setShowExplanations((prev) => ({ ...prev, [qIdx]: true }));
  };

  const toggleHint = (qIdx: number) => {
    setRevealedHints((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const handleFinishQuiz = () => {
    setIsSubmitted(true);
    // Reveal all explanations
    const allExp: Record<number, boolean> = {};
    quiz.forEach((_, idx) => {
      allExp[idx] = true;
    });
    setShowExplanations(allExp);

    if (onComplete) {
      onComplete(calculateScore(), quiz.length);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanations({});
    setRevealedHints({});
    setIsSubmitted(false);
  };

  const score = calculateScore();
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === quiz.length;

  return (
    <div className="space-y-6">
      {/* Quiz Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {quiz.length} DIAGNOSTIC PROBLEMS
          </Badge>
          <span className="text-xs text-slate-500 font-medium">
            {answeredCount} of {quiz.length} Answered
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSubmitted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Retake Diagnostic
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinishQuiz}
              disabled={answeredCount === 0}
              className="text-xs"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Score Summary Box (if submitted) */}
      {isSubmitted && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Diagnostic Score: {score} / {quiz.length} ({Math.round((score / quiz.length) * 100)}%)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {score === quiz.length
                  ? 'Flawless execution! You have verified first-principles mastery.'
                  : 'Review the step-by-step rationales below to target concept gaps.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
            Try Again
          </Button>
        </div>
      )}

      {/* Question Cards */}
      <div className="space-y-6">
        {quiz.map((q, qIdx) => {
          const selectedOpt = selectedAnswers[qIdx];
          const hasAnswered = selectedOpt !== undefined;
          const isCorrect = selectedOpt === q.correctIndex;
          const showExp = showExplanations[qIdx];

          return (
            <div
              key={q.id || qIdx}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                hasAnswered
                  ? isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Question metadata badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    Question {qIdx + 1}
                  </span>
                  {q.bloomLevel && (
                    <Badge variant="default" size="sm">
                      Bloom: {q.bloomLevel}
                    </Badge>
                  )}
                  {q.difficulty && (
                    <Badge
                      variant={q.difficulty === 'hard' ? 'error' : q.difficulty === 'medium' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {q.difficulty}
                    </Badge>
                  )}
                </div>

                {q.hints && q.hints.length > 0 && !hasAnswered && (
                  <button
                    onClick={() => toggleHint(qIdx)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{revealedHints[qIdx] ? 'Hide Socratic Clue' : 'Need a Clue?'}</span>
                  </button>
                )}
              </div>

              {/* Socratic Hint */}
              {revealedHints[qIdx] && q.hints && q.hints.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Socratic Hint:</strong> {q.hints[0]}
                </div>
              )}

              {/* Question Text */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-4 leading-relaxed">
                {q.question}
              </h3>

              {/* Options Grid */}
              <div className="space-y-2.5">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selectedOpt === optIdx;
                  const isThisCorrect = q.correctIndex === optIdx;

                  let optClasses =
                    'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      optClasses =
                        'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isThisSelected && !isThisCorrect) {
                      optClasses =
                        'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200 line-through';
                    } else {
                      optClasses = 'border-slate-200 dark:border-slate-800 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${optClasses}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          hasAnswered && isThisCorrect
                            ? 'bg-emerald-600 text-white'
                            : hasAnswered && isThisSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 pt-0.5">{opt}</span>
                      {hasAnswered && isThisCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {hasAnswered && isThisSelected && !isThisCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pedagogical Explanation Box */}
              {showExp && (
                <div
                  className={`mt-4 p-4 rounded-xl text-xs space-y-1.5 border animate-in fade-in duration-150 ${
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-indigo-500/10 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>First-Principles Rationale:</span>
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
