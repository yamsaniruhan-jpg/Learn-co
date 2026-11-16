import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  Award,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QuestionBankItem } from '../../types/curriculum';
import { LearningClient } from '../../services/learningClient';
import { useAuth } from '../../context/AuthContext';
import { FormattedMathText } from '../common/FormattedMathText';

type ContestTrack = 'ipho' | 'icho' | 'ibho' | 'ijso' | 'ict' | 'mixed';

interface ContestPreset {
  id: string;
  label: string;
  durationMinutes: number;
  questionCount: number;
  summary: string;
}

const TRACK_OPTIONS: Array<{
  id: ContestTrack;
  code: string;
  title: string;
  focus: string;
}> = [
  { id: 'ipho', code: 'IPhO', title: 'Physics Olympiad', focus: 'Thermodynamics, Electrodynamics, Optics & Collisions' },
  { id: 'icho', code: 'IChO', title: 'Chemistry Olympiad', focus: 'Latimer RedOx, Kinetics, Gibbs & Equilibria' },
  { id: 'ibho', code: 'IBHO', title: 'Biology Olympiad', focus: 'Enzyme Kinetics, Bioenergetics & Population Genetics' },
  { id: 'ijso', code: 'IJSO', title: 'Junior Science Olympiad', focus: 'Integrated Physics, Fluid Mechanics & Stoichiometry' },
  { id: 'ict', code: 'ICT', title: 'Coding & Algorithms', focus: 'DP, Graphs, Bitwise Trees & Modular Number Theory' },
  { id: 'mixed', code: 'ALL', title: 'Full STEM Triathlon', focus: 'Balanced cross-discipline Olympiad simulation' },
];

const CONTEST_PRESETS: ContestPreset[] = [
  { id: 'sprint', label: '30m Sprint · 10 Q', durationMinutes: 30, questionCount: 10, summary: 'High-pace diagnostic warm-up' },
  { id: 'regional', label: '60m Regional · 15 Q', durationMinutes: 60, questionCount: 15, summary: 'NSEP / NSEJS / Stage-1 cadence' },
  { id: 'national', label: '120m National · 25 Q', durationMinutes: 120, questionCount: 25, summary: 'Full-endurance Olympiad paper' },
];

type RedactedContestQuestion = Omit<
  QuestionBankItem,
  'correctAnswer' | 'explanation' | 'stepByStepSolution'
>;

interface ContestResultsData {
  contestId: string;
  track: string;
  title: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  medalTier: string;
  totalXpEarned: number;
  timeSpentSeconds: number;
  reviews: Array<{
    question: QuestionBankItem;
    userAnswer: any;
    isCorrect: boolean;
    xpAwarded: number;
    timeSpent: number;
  }>;
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const OlympiadContestView: React.FC = () => {
  const { refreshUserData } = useAuth();
  const [phase, setPhase] = useState<'setup' | 'active' | 'results'>('setup');
  const [selectedTrack, setSelectedTrack] = useState<ContestTrack>('ipho');
  const [selectedPreset, setSelectedPreset] = useState<ContestPreset>(CONTEST_PRESETS[0]);

  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [contestId, setContestId] = useState<string>('');
  const [contestTitle, setContestTitle] = useState<string>('');
  const [questions, setQuestions] = useState<RedactedContestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(1800);
  const [remainingSeconds, setRemainingSeconds] = useState(1800);

  const [results, setResults] = useState<ContestResultsData | null>(null);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set());

  const submittedOnceRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;

  const submitContest = useCallback(
    async (isAuto = false) => {
      if (submittedOnceRef.current || !contestId || questions.length === 0) return;
      submittedOnceRef.current = true;
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        const elapsed = Math.max(1, totalDurationSeconds - remainingRef.current);
        const data = await LearningClient.submitOlympiadContest({
          contestId,
          track: selectedTrack,
          questionIds: questions.map((q) => q.id),
          answers: answersRef.current,
          timeSpentSeconds: elapsed,
        });
        setResults(data);
        setPhase('results');
        await refreshUserData();
      } catch (err: any) {
        submittedOnceRef.current = false;
        setErrorMsg(
          isAuto
            ? `Time expired, but submission encountered a network error: ${err?.message || 'Retry below.'}`
            : err?.message || 'Failed to submit contest.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [contestId, questions, selectedTrack, totalDurationSeconds, refreshUserData]
  );

  // Countdown tick during active phase
  useEffect(() => {
    if (phase !== 'active') return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void submitContest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submitContest]);

  const handleStartContest = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    submittedOnceRef.current = false;
    try {
      const data = await LearningClient.startOlympiadContest({
        track: selectedTrack,
        durationMinutes: selectedPreset.durationMinutes,
        questionCount: selectedPreset.questionCount,
      });
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No Olympiad questions could be generated for this track.');
      }
      setContestId(data.contestId);
      setContestTitle(data.title);
      setQuestions(data.questions);
      setAnswers({});
      setFlaggedIds(new Set());
      setVisitedIds(new Set([data.questions[0].id]));
      setCurrentIndex(0);
      setTotalDurationSeconds(data.durationSeconds);
      setRemainingSeconds(data.durationSeconds);
      setResults(null);
      setExpandedReviewIds(new Set());
      setPhase('active');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not launch Olympiad contest.');
    } finally {
      setIsStarting(false);
    }
  };

  const goToIndex = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentIndex(idx);
    const targetId = questions[idx]?.id;
    if (targetId) {
      setVisitedIds((prev) => new Set(prev).add(targetId));
    }
  };

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const setAnswer = (qId: string, val: any) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
        delete next[qId];
      } else {
        next[qId] = val;
      }
      return next;
    });
  };

  const toggleMultiOption = (qId: string, option: string) => {
    const existing = Array.isArray(answers[qId]) ? (answers[qId] as string[]) : [];
    if (existing.includes(option)) {
      setAnswer(
        qId,
        existing.filter((x) => x !== option)
      );
    } else {
      setAnswer(qId, [...existing, option]);
    }
  };

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;

  // SETUP SCREEN
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Delayed-Grading Exam Mode &middot; Non-Repeating Variants
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Timed Olympiad Mock Contest
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Simulate official competition conditions. Answer keys and derivations remain sealed until you finish or time runs out, followed by medal standing classification and full solution review.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>Server-graded submission</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Track Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              1. Select Olympiad Track
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRACK_OPTIONS.map((t) => {
                const active = selectedTrack === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTrack(t.id)}
                    className={`min-h-[44px] p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black tracking-wide text-indigo-600 dark:text-indigo-400">
                        {t.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {active ? 'Selected' : 'Track'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {t.title}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {t.focus}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Paper Format */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. Select Paper Duration &amp; Length
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTEST_PRESETS.map((preset) => {
                const active = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`min-h-[44px] p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                      {preset.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {preset.summary}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Timer auto-submits at <span className="font-mono font-bold tabular-nums">00:00</span>. Medal thresholds: Gold &ge;85% &middot; Silver &ge;70% &middot; Bronze &ge;50%.
            </div>
            <button
              type="button"
              onClick={handleStartContest}
              disabled={isStarting}
              className="min-h-[44px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer shrink-0"
            >
              {isStarting ? 'Generating Exam Paper...' : 'Start Timed Contest'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS REPORT
  if (phase === 'results' && results) {
    const medalTone =
      results.medalTier.includes('Gold')
        ? 'text-amber-500'
        : results.medalTier.includes('Silver')
        ? 'text-slate-400'
        : results.medalTier.includes('Bronze')
        ? 'text-orange-500'
        : 'text-indigo-500';

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Contest Score Report &middot; {results.title}
              </div>
              <div className="flex items-center gap-3">
                <Trophy className={`w-8 h-8 shrink-0 ${medalTone}`} />
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {results.medalTier}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Completed in{' '}
                <span className="font-mono font-bold tabular-nums">
                  {formatClock(results.timeSpentSeconds)}
                </span>{' '}
                &middot; All answers verified against server solutions.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[11px] text-slate-500 font-semibold">Score</div>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {results.correctCount}/{results.totalQuestions}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[11px] text-slate-500 font-semibold">Accuracy</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {results.accuracy}%
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[11px] text-slate-500 font-semibold">XP Earned</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{results.totalXpEarned}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Question-by-Question Solution Review
            </h3>
            {results.reviews.map((rev, idx) => {
              const expanded = expandedReviewIds.has(rev.question.id);
              const formattedUser =
                rev.userAnswer === undefined || rev.userAnswer === ''
                  ? 'Unanswered'
                  : Array.isArray(rev.userAnswer)
                  ? rev.userAnswer.join(', ')
                  : String(rev.userAnswer);
              const formattedKey = Array.isArray(rev.question.correctAnswer)
                ? rev.question.correctAnswer.join(', ')
                : String(rev.question.correctAnswer);

              return (
                <div
                  key={rev.question.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReviewIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(rev.question.id)) next.delete(rev.question.id);
                        else next.add(rev.question.id);
                        return next;
                      })
                    }
                    className="w-full min-h-[44px] p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {rev.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          Q{idx + 1}. {rev.question.topicId} &middot; {rev.question.difficulty.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Your answer: <span className="font-mono">{formattedUser}</span> &middot; Official key:{' '}
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {formattedKey}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {expanded && (
                    <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        <FormattedMathText text={rev.question.questionText} />
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-slate-700 dark:text-slate-200 space-y-1.5">
                        <div className="font-bold text-emerald-700 dark:text-emerald-300">
                          Explanation &amp; Key Derivation
                        </div>
                        <FormattedMathText text={rev.question.explanation} />
                        {Array.isArray(rev.question.stepByStepSolution) &&
                          rev.question.stepByStepSolution.length > 0 && (
                            <ol className="list-decimal list-inside space-y-1 pt-1 text-slate-600 dark:text-slate-300">
                              {rev.question.stepByStepSolution.map((step, sIdx) => (
                                <li key={sIdx}>
                                  <FormattedMathText text={step} />
                                </li>
                              ))}
                            </ol>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setPhase('setup');
                setResults(null);
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Olympiad Contest</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE TIMED CONTEST
  const q = questions[currentIndex];
  if (!q) return null;

  const isLowTime = remainingSeconds < 300;
  const currentAnswer = answers[q.id];
  const isFlagged = flaggedIds.has(q.id);

  return (
    <div className="space-y-4">
      {/* Top Contest Header Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {contestTitle} &middot; Delayed Grading Active
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            Question {currentIndex + 1} of {questions.length} &middot; {answeredCount} Answered
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-2 rounded-xl border font-mono text-sm font-black tabular-nums flex items-center gap-2 ${
              isLowTime
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatClock(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => void submitContest(false)}
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Contest'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Question Surface */}
        <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">{q.subjectId}</span>{' '}
              &middot; {q.topicId} &middot;{' '}
              <span className="capitalize">{q.difficulty.replace('_', ' ')}</span>
            </div>

            <button
              type="button"
              onClick={() => toggleFlag(q.id)}
              className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isFlagged
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>
          </div>

          <div className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-serif">
            <FormattedMathText text={q.questionText} />
          </div>

          {q.codeSnippet && (
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
              <code>{q.codeSnippet.code}</code>
            </pre>
          )}

          {/* Response Controls */}
          {q.questionType === 'numerical' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Numerical Answer {q.numericalUnit ? `(${q.numericalUnit})` : ''}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentAnswer ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Enter numeric value..."
                className="w-full max-w-xs min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm"
              />
            </div>
          ) : q.questionType === 'multiple_choice' && Array.isArray(q.options) ? (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Select all correct statements:
              </div>
              {q.options.map((opt, idx) => {
                const selectedArr = Array.isArray(currentAnswer) ? currentAnswer : [];
                const checked = selectedArr.includes(opt);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleMultiOption(q.id, opt)}
                    className={`w-full min-h-[44px] p-3.5 rounded-xl border text-left text-sm flex items-center gap-3 cursor-pointer transition-colors ${
                      checked
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 border ${
                        checked
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {checked ? '✓' : String.fromCharCode(65 + idx)}
                    </span>
                    <div className="flex-1">
                      <FormattedMathText text={opt} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {(q.options && q.options.length > 0 ? q.options : ['True', 'False']).map((opt, idx) => {
                const selected = currentAnswer === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={`w-full min-h-[44px] p-3.5 rounded-xl border text-left text-sm flex items-center gap-3 cursor-pointer transition-colors ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                        selected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className="flex-1">
                      <FormattedMathText text={opt} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setAnswer(q.id, undefined)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Clear Response
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => goToIndex(currentIndex - 1)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToIndex(currentIndex + 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void submitContest(false)}
                  disabled={isSubmitting}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Finish &amp; Grade</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Question Palette
            </h3>
            <span className="text-xs font-semibold text-slate-400 tabular-nums">
              {flaggedIds.size} flagged
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((item, idx) => {
              const a = answers[item.id];
              const isAnswered = a !== undefined && a !== '' && (!Array.isArray(a) || a.length > 0);
              const itemFlagged = flaggedIds.has(item.id);
              const isCurrent = idx === currentIndex;
              const isVisited = visitedIds.has(item.id);

              let cls =
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
              if (itemFlagged) {
                cls =
                  'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-400';
              } else if (isAnswered) {
                cls =
                  'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-400';
              } else if (isVisited) {
                cls =
                  'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`Jump to question ${idx + 1}`}
                  className={`min-h-[44px] min-w-[44px] rounded-xl border text-xs font-bold tabular-nums transition-all cursor-pointer ${cls} ${
                    isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1 dark:ring-offset-slate-900' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-800 inline-block" />
              <span>Visited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block" />
              <span>Unvisited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
