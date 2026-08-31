import React, { useState, useEffect } from 'react';
import { QuestionBankItem, PracticeSessionConfig } from '../../types/curriculum';
import { AuthClient } from '../../services/authClient';
import { LearningClient } from '../../services/learningClient';
import { sounds } from '../../utils/sound';
import { recordDailyActivity } from '../../utils/streakManager';
import confetti from 'canvas-confetti';
import {
  Clock,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Send,
  Bot,
  Zap,
  Pause,
  Play,
  BookmarkPlus,
} from 'lucide-react';

interface PracticeArenaProps {
  questions: QuestionBankItem[];
  config: PracticeSessionConfig;
  onFinishSession: (results: {
    totalQuestions: number;
    correctCount: number;
    totalXpEarned: number;
    timeSpentSeconds: number;
    questionReviews: Array<{
      question: QuestionBankItem;
      userAnswer: any;
      isCorrect: boolean;
      timeSpent: number;
      hintsUsed: number;
    }>;
  }) => void;
  onExit: () => void;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  questions,
  config,
  onFinishSession,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [numericalInput, setNumericalInput] = useState<string>('');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>([]);
  
  const [isSubmitted, setIsSubmitted] = useState<Record<string, boolean>>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<string, any>>({});
  const [hintsRevealed, setHintsRevealed] = useState<Record<string, number>>({});
  const [aiHints, setAiHints] = useState<Record<string, string[]>>({});
  const [isLoadingAiHint, setIsLoadingAiHint] = useState<boolean>(false);
  
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<string, number>>({});
  const [totalTimerSeconds, setTotalTimerSeconds] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [totalXpAwarded, setTotalXpAwarded] = useState<number>(0);

  const currentQuestion = questions[currentIndex];
  const questionId = currentQuestion?.id || `q-${currentIndex}`;

  // Timer effect
  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      setTotalTimerSeconds((prev) => prev + 1);
      setTimeSpentPerQuestion((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, questionId]);

  // Sync state when moving between questions
  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.questionType === 'numerical') {
      setNumericalInput(selectedAnswers[currentQuestion.id]?.toString() || '');
    } else if (currentQuestion.questionType === 'multiple_choice') {
      setMultiSelectAnswers(
        Array.isArray(selectedAnswers[currentQuestion.id])
          ? selectedAnswers[currentQuestion.id]
          : []
      );
    }
  }, [currentIndex, currentQuestion]);

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500">No questions available in this session.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Return
        </button>
      </div>
    );
  }

  const handleSelectOption = (option: string) => {
    if (isSubmitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleToggleMultiOption = (option: string) => {
    if (isSubmitted[questionId]) return;
    let next: string[];
    if (multiSelectAnswers.includes(option)) {
      next = multiSelectAnswers.filter((x) => x !== option);
    } else {
      next = [...multiSelectAnswers, option];
    }
    setMultiSelectAnswers(next);
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: next }));
  };

  const handleNumericalChange = (val: string) => {
    if (isSubmitted[questionId]) return;
    setNumericalInput(val);
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: parseFloat(val) || val }));
  };

  const revealNextHint = () => {
    const current = hintsRevealed[questionId] || 0;
    if (currentQuestion.hints && current < currentQuestion.hints.length) {
      setHintsRevealed((prev) => ({ ...prev, [questionId]: current + 1 }));
    }
  };

  const requestAiSocraticHint = async () => {
    setIsLoadingAiHint(true);
    try {
      const hint = await LearningClient.requestSocraticHint(
        currentQuestion.questionText,
        currentQuestion.topicId,
        hintsRevealed[questionId] || 0
      );
      setAiHints((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), hint],
      }));
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  const handleSubmitAttempt = async () => {
    const rawAnswer = selectedAnswers[questionId];
    if (rawAnswer === undefined || rawAnswer === '' || (Array.isArray(rawAnswer) && rawAnswer.length === 0)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Evaluate locally first for rich representation
      let isCorrect = false;

      if (currentQuestion.questionType === 'multiple_choice') {
        const correctArray = Array.isArray(currentQuestion.correctAnswer)
          ? currentQuestion.correctAnswer
          : [currentQuestion.correctAnswer];
        const userArray = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];
        isCorrect =
          correctArray.length === userArray.length &&
          correctArray.every((a) => userArray.includes(a as any));
      } else if (currentQuestion.questionType === 'numerical') {
        const userNum = parseFloat(rawAnswer);
        const correctNum = typeof currentQuestion.correctAnswer === 'number'
          ? currentQuestion.correctAnswer
          : parseFloat(currentQuestion.correctAnswer as string);
        const tol = currentQuestion.numericalTolerance ?? 0.05;
        isCorrect = !isNaN(userNum) && Math.abs(userNum - correctNum) <= tol;
      } else {
        isCorrect =
          rawAnswer.toString().trim().toLowerCase() ===
          currentQuestion.correctAnswer.toString().trim().toLowerCase();
      }

      // Submit authoritatively to backend xpEngine
      const submitRes = await fetch('/api/practice/submit-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthClient.getToken()}`,
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: rawAnswer.toString(),
          isCorrect,
          timeSpentSeconds: timeSpentPerQuestion[questionId] || 15,
          conceptId: currentQuestion.conceptId,
          topicId: currentQuestion.topicId,
          subjectId: currentQuestion.subjectId,
          hintsUsedCount: hintsRevealed[questionId] || 0,
        }),
      });

      const data = await submitRes.json();

      // Record daily streak activity in gamification system
      recordDailyActivity('default_user', {
        questionsSolved: 1,
        xpEarned: isCorrect ? (data.xpEarned || 5) : 0,
        minutesStudied: Math.ceil((timeSpentPerQuestion[questionId] || 15) / 60),
      });

      setIsSubmitted((prev) => ({ ...prev, [questionId]: true }));
      setSubmissionFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect,
          xpEarned: data.xpEarned || (isCorrect ? 5 : 0),
          dailyQuotaRemaining: data.dailyQuotaRemaining,
          newStreak: data.currentStreak,
        },
      }));

      if (isCorrect) {
        sounds.playSuccess();
        setTotalXpAwarded((prev) => prev + (data.xpEarned || 5));
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        sounds.playFailure();
      }
    } catch (err) {
      sounds.playFailure();
      // Fallback local submission
      setIsSubmitted((prev) => ({ ...prev, [questionId]: true }));
      setSubmissionFeedback((prev) => ({
        ...prev,
        [questionId]: { isCorrect: false, xpEarned: 0 },
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextOrFinish = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finish Session
      const questionReviews = questions.map((q) => ({
        question: q,
        userAnswer: selectedAnswers[q.id],
        isCorrect: submissionFeedback[q.id]?.isCorrect || false,
        timeSpent: timeSpentPerQuestion[q.id] || 10,
        hintsUsed: hintsRevealed[q.id] || 0,
      }));

      const correctCount = questionReviews.filter((r) => r.isCorrect).length;

      if (correctCount === questions.length) {
        sounds.playLevelUp();
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
        });
      } else if (correctCount > 0) {
        sounds.playSuccess();
      }

      onFinishSession({
        totalQuestions: questions.length,
        correctCount,
        totalXpEarned: totalXpAwarded,
        timeSpentSeconds: totalTimerSeconds,
        questionReviews,
      });
    }
  };

  const isCurrentSubmitted = isSubmitted[questionId] || false;
  const currentFeedback = submissionFeedback[questionId];
  const userHasSelected = selectedAnswers[questionId] !== undefined && selectedAnswers[questionId] !== '';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Practice Arena Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold font-mono text-xs">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {currentQuestion.subjectId}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
            {currentQuestion.difficulty.replace('_', ' ')}
          </span>
        </div>

        {/* Live Timer & Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{formatTime(totalTimerSeconds)}</span>
          </div>

          <button
            onClick={() => setIsTimerPaused(!isTimerPaused)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isTimerPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1 text-amber-500 font-bold">
            <Zap className="w-4 h-4 fill-current" />
            <span>+{totalXpAwarded} XP</span>
          </div>

          <button
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-rose-500 font-sans font-medium transition-colors cursor-pointer"
          >
            Exit Arena
          </button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-2 px-1">
        {questions.map((q, idx) => {
          const isDone = isSubmitted[q.id];
          const isCorr = submissionFeedback[q.id]?.isCorrect;
          const isCur = idx === currentIndex;
          return (
            <div
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                isCur ? 'w-8 bg-indigo-600' : 'w-full'
              } ${
                isDone
                  ? isCorr
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Question Type & Topic Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {currentQuestion.topicId}
          </span>
          <span className="capitalize font-mono text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {currentQuestion.questionType.replace('_', ' ')}
          </span>
        </div>

        {/* Question Statement */}
        <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed font-serif">
          {currentQuestion.questionText}
        </div>

        {/* Optional Code Snippet */}
        {currentQuestion.codeSnippet && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
            <div className="text-[10px] text-slate-500 uppercase mb-1 font-sans">
              {currentQuestion.codeSnippet.language}
            </div>
            <pre>{currentQuestion.codeSnippet.code}</pre>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE INPUT / OPTIONS SECTION                                       */}
        {/* ========================================================================= */}

        {/* 1. Single Choice & Assertion Reason */}
        {(currentQuestion.questionType === 'single_choice' ||
          currentQuestion.questionType === 'assertion_reason' ||
          (currentQuestion.questionType === 'code_output' && currentQuestion.options)) && (
          <div className="space-y-3">
            {currentQuestion.options?.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isSelected = selectedAnswers[questionId] === opt;
              const isCorrectOpt = isCurrentSubmitted && (
                opt.toString().trim() === currentQuestion.correctAnswer.toString().trim()
              );
              const isWrongOpt = isCurrentSubmitted && isSelected && !isCorrectOpt;

              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isCurrentSubmitted}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isCorrectOpt
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold shadow-sm'
                      : isWrongOpt
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {letter}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {isWrongOpt && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Multiple Choice (Multi-Correct) */}
        {currentQuestion.questionType === 'multiple_choice' && (
          <div className="space-y-3">
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              • Multiple Correct Options: Select all valid statements
            </div>
            {currentQuestion.options?.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isSelected = multiSelectAnswers.includes(opt);
              const correctArray = Array.isArray(currentQuestion.correctAnswer)
                ? currentQuestion.correctAnswer
                : [currentQuestion.correctAnswer];
              const isCorrectOpt = isCurrentSubmitted && correctArray.includes(opt);
              const isWrongSelected = isCurrentSubmitted && isSelected && !isCorrectOpt;

              return (
                <button
                  key={oIdx}
                  onClick={() => handleToggleMultiOption(opt)}
                  disabled={isCurrentSubmitted}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isCorrectOpt
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : isWrongSelected
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {letter}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {isWrongSelected && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Numerical Value Input */}
        {currentQuestion.questionType === 'numerical' && (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Enter Exact Numerical Value (or within tolerance):
            </label>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="number"
                step="any"
                placeholder="e.g. 6 or 1.92"
                disabled={isCurrentSubmitted}
                value={numericalInput}
                onChange={(e) => handleNumericalChange(e.target.value)}
                className="w-full text-base font-mono font-bold px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {currentQuestion.numericalUnit && (
                <span className="text-xs font-mono text-slate-500">{currentQuestion.numericalUnit}</span>
              )}
            </div>
            {isCurrentSubmitted && (
              <div className="text-xs text-slate-500 font-mono">
                Authoritative Correct Value: <span className="text-emerald-500 font-bold">{currentQuestion.correctAnswer}</span>
              </div>
            )}
          </div>
        )}

        {/* 4. Conceptual True/False */}
        {currentQuestion.questionType === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {['True', 'False'].map((tf) => {
              const isSelected = selectedAnswers[questionId] === tf;
              const isCorrectOpt = isCurrentSubmitted && currentQuestion.correctAnswer.toString().toLowerCase() === tf.toLowerCase();
              const isWrongSelected = isCurrentSubmitted && isSelected && !isCorrectOpt;

              return (
                <button
                  key={tf}
                  onClick={() => handleSelectOption(tf)}
                  disabled={isCurrentSubmitted}
                  className={`p-5 rounded-xl border text-center font-bold text-base transition-all cursor-pointer ${
                    isCorrectOpt
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : isWrongSelected
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* HINTS ACCORDION & SOCRATIC COPILOT                                        */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <button
                  onClick={revealNextHint}
                  disabled={isCurrentSubmitted || (hintsRevealed[questionId] || 0) >= currentQuestion.hints.length}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    Reveal Progressive Hint ({hintsRevealed[questionId] || 0}/{currentQuestion.hints.length})
                  </span>
                </button>
              )}

              <button
                onClick={requestAiSocraticHint}
                disabled={isLoadingAiHint || isCurrentSubmitted}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-purple-500" />
                <span>{isLoadingAiHint ? 'Generating Hint...' : 'Socratic AI Guidance'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              No XP penalty for using hints in practice mode
            </div>
          </div>

          {/* Rendered Hints */}
          {hintsRevealed[questionId] > 0 && currentQuestion.hints && (
            <div className="space-y-2 pt-2">
              {currentQuestion.hints.slice(0, hintsRevealed[questionId]).map((hintText, hIdx) => (
                <div
                  key={hIdx}
                  className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                >
                  <span className="font-bold text-amber-600 dark:text-amber-400">Hint {hIdx + 1}:</span>
                  <span>{hintText}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rendered AI Socratic Hints */}
          {aiHints[questionId] && aiHints[questionId].length > 0 && (
            <div className="space-y-2 pt-1">
              {aiHints[questionId].map((aiH, aiIdx) => (
                <div
                  key={aiIdx}
                  className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2"
                >
                  <Bot className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Socratic Tutor Observation:</span>
                    <span>{aiH}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* POST-SUBMISSION STEP-BY-STEP SOLUTION REVEAL                              */}
        {/* ========================================================================= */}
        {isCurrentSubmitted && (
          <div
            className={`p-5 rounded-xl border space-y-4 animate-in fade-in duration-200 ${
              currentFeedback?.isCorrect
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentFeedback?.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      Correct! +5 XP Awarded
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span className="font-bold text-sm text-rose-900 dark:text-rose-200">
                      Incorrect (Logged to Mistake Notebook)
                    </span>
                  </>
                )}
              </div>

              {currentFeedback?.newStreak > 1 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{currentFeedback.newStreak}-Day Streak Active</span>
                </div>
              )}
            </div>

            {/* Explanation & Step-by-Step Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-800 dark:text-slate-200">
              <div className="font-semibold text-slate-900 dark:text-white">Explanation:</div>
              <p className="leading-relaxed">{currentQuestion.explanation}</p>

              {currentQuestion.stepByStepSolution && currentQuestion.stepByStepSolution.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="font-semibold text-slate-900 dark:text-white">Step-by-Step Invariant Derivation:</div>
                  {currentQuestion.stepByStepSolution.map((st, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2">
                      <span className="font-mono text-indigo-500 font-bold">{sIdx + 1}.</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Previous
          </button>

          {!isCurrentSubmitted ? (
            <button
              onClick={handleSubmitAttempt}
              disabled={!userHasSelected || isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Checking with Server...' : 'Submit Answer'}</span>
            </button>
          ) : (
            <button
              onClick={handleNextOrFinish}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Session Results'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
