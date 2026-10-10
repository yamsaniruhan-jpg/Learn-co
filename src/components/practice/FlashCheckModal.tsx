import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
  Award,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormattedMathText } from '../common/FormattedMathText';
import { SubjectId } from '../../types/curriculum';

export interface FlashCheckQuestion {
  id: string;
  subjectId: SubjectId;
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  invariantTip: string;
}

const SAMPLE_FLASH_QUESTIONS: FlashCheckQuestion[] = [
  {
    id: 'fc-1',
    subjectId: 'math',
    topic: 'Multivariable Optimization',
    questionText: 'For a $C^2$ function $f(x, y)$, if $\\nabla f(x_0, y_0) = \\vec{0}$ and the Hessian determinant $\\det(H) > 0$ with $f_{xx} > 0$, what is $(x_0, y_0)$?',
    options: [
      'Strict local minimum',
      'Strict local maximum',
      'Saddle point',
      'Inconclusive test',
    ],
    correctAnswer: 'Strict local minimum',
    explanation: 'Since $\\det(H) = f_{xx}f_{yy} - (f_{xy})^2 > 0$ and $f_{xx} > 0$, both eigenvalues of the symmetric Hessian matrix are strictly positive, ensuring strict local convexity.',
    invariantTip: 'Curvature eigenvalue signs govern positive definiteness invariant under orthogonal coordinate changes.',
  },
  {
    id: 'fc-2',
    subjectId: 'physics',
    topic: 'Classical Mechanics & Invariants',
    questionText: 'According to Noether\'s Theorem, which continuous spatial symmetry corresponds to the conservation of linear momentum?',
    options: [
      'Spatial translation invariance',
      'Time translation invariance',
      'Rotational invariance',
      'Lorentz gauge symmetry',
    ],
    correctAnswer: 'Spatial translation invariance',
    explanation: 'Homogeneity of space (invariance under spatial translations $\\vec{r} \\to \\vec{r} + \\vec{\\epsilon}$) implies the vanishing of the spatial gradient of the Lagrangian, yielding $\\frac{d\\vec{P}}{dt} = \\vec{0}$.',
    invariantTip: 'Symmetries of action functionals directly generate physical conserved quantities.',
  },
  {
    id: 'fc-3',
    subjectId: 'cs',
    topic: 'Algorithmic Complexity',
    questionText: 'What is the tight worst-case asymptotic time complexity of finding the median in an unsorted array of size $N$ using the Median-of-Medians pivot algorithm?',
    options: [
      '$O(N)$ linear time',
      '$O(N \\log N)$',
      '$O(N^2)$ quadratic time',
      '$O(\\log N)$',
    ],
    correctAnswer: '$O(N)$ linear time',
    explanation: 'The Median-of-Medians selection guarantees that the pivot eliminates at least $30\\%$ of elements each round, yielding recurrence $T(N) \\le T(N/5) + T(7N/10) + O(N) = O(N)$.',
    invariantTip: 'Recurrences where subproblem coefficient sums are strictly less than 1 ($1/5 + 7/10 = 9/10 < 1$) remain linear.',
  },
];

interface FlashCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (xpEarned: number) => void;
  onAskCopilot?: (questionText: string) => void;
}

export const FlashCheckModal: React.FC<FlashCheckModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onAskCopilot,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);

  const questions = SAMPLE_FLASH_QUESTIONS;
  const currentQ = questions[currentIndex];

  // 60-Second Countdown Timer
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isFinished]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setTimeLeft(60);
      setIsFinished(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectOption = (opt: string) => {
    if (isAnswered || isFinished) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (onComplete) {
        onComplete(15 + score * 5);
      }
    }
  };

  const timerPercent = Math.max(0, (timeLeft / 60) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress & Timer Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft < 15 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-indigo-600'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Flash Check: Spaced Micro-Quiz
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  60s Sprint
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Question {currentIndex + 1} of {questions.length} • {currentQ?.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 font-mono text-xs font-bold ${
              timeLeft < 15 ? 'text-rose-500 animate-pulse' : 'text-slate-600 dark:text-slate-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        {!isFinished ? (
          <div className="p-5 space-y-4">
            {/* Question Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed">
              <FormattedMathText text={currentQ.questionText} />
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-800 dark:text-slate-200';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold';
                  } else {
                    btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isAnswered}
                    className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <FormattedMathText text={opt} inline />
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Invariant Tip after answering */}
            {isAnswered && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2 text-xs animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                    Step-by-Step Reason
                  </span>
                  <div className="text-slate-700 dark:text-slate-300 leading-snug">
                    <FormattedMathText text={currentQ.explanation} />
                  </div>
                </div>

                <div className="pt-1.5 border-t border-indigo-200/60 dark:border-indigo-900/60 flex items-start gap-1.5 text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium">
                    <strong>Invariant Insight:</strong> {currentQ.invariantTip}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completion Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Flash Check Completed!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Score: <strong className="text-slate-800 dark:text-slate-100">{score} / {questions.length} Correct</strong> • Retained Invariants Updated
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{15 + score * 5} XP Earned & Spaced Repetition Retained</span>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          {!isFinished ? (
            <>
              {onAskCopilot && isAnswered ? (
                <button
                  type="button"
                  onClick={() => {
                    onAskCopilot(`I was solving this Flash Check question: "${currentQ.questionText}". Can you walk me through the first-principles derivation?`);
                    onClose();
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ask Copilot for Details</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Select an answer to reveal explanation
                </span>
              )}

              {isAnswered && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
