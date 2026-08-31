import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Zap,
  Target,
  Layers,
  Flame,
} from 'lucide-react';
import { SubjectId } from '../../types/curriculum';
import {
  DayOfWeek,
  PlanGenerationInput,
  StudyPlan,
  StudyTask,
  StudyGoal,
} from '../../types/planner';

interface AiPlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGeneratedAndApplied: (plan: StudyPlan, tasks: StudyTask[]) => void;
}

const ALL_SUBJECTS: { id: SubjectId; name: string; icon: string; color: string }[] = [
  { id: 'math', name: 'Mathematics', icon: '📐', color: 'indigo' },
  { id: 'cs', name: 'Computer Science', icon: '💻', color: 'blue' },
  { id: 'physics', name: 'Physics', icon: '⚛️', color: 'amber' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'emerald' },
  { id: 'biology', name: 'Biology', icon: '🧬', color: 'rose' },
];

const DAYS_OF_WEEK: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

const EXAM_TRACKS = [
  'Advanced STEM Mastery',
  'JEE Advanced Sprint',
  'AP Physics & Calculus',
  'NEET Biology & Chemistry',
  'Computer Science Olympiad',
  'General High School Honors',
];

export const AiPlanWizardModal: React.FC<AiPlanWizardModalProps> = ({
  isOpen,
  onClose,
  onPlanGeneratedAndApplied,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [goalTitle, setGoalTitle] = useState('30-Day Comprehensive STEM Sprint');
  const [targetExamTrack, setTargetExamTrack] = useState('Advanced STEM Mastery');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(['math', 'cs']);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ]);
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(120);
  const [preferredStartTime, setPreferredStartTime] = useState('17:30');
  const [preferredSessionLength, setPreferredSessionLength] = useState(45);
  const [includeWeakMistakeRemediation, setIncludeWeakMistakeRemediation] = useState(true);
  const [includeSpacedRevision, setIncludeSpacedRevision] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');

  // Generation Preview State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<Partial<StudyPlan> | null>(null);
  const [previewTasks, setPreviewTasks] = useState<Partial<StudyTask>[]>([]);
  const [previewGoal, setPreviewGoal] = useState<Partial<StudyGoal> | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSubject = (sub: SubjectId) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    if (availableDays.includes(day)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== day));
      }
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    setStep(4);

    const payload: PlanGenerationInput = {
      goalTitle,
      targetExamTrack,
      targetDate,
      subjects: selectedSubjects,
      availableDays,
      dailyAvailableMinutes,
      preferredStartTime,
      preferredSessionLength,
      includeWeakMistakeRemediation,
      includeSpacedRevision,
      customPrompt: customPrompt.trim() || undefined,
    };

    try {
      const res = await fetch('/api/planner/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI plan.');
      }

      const data = await res.json();
      setPreviewPlan(data.plan);
      setPreviewTasks(data.tasks || []);
      setPreviewGoal(data.goal);
    } catch (err: any) {
      setError(err.message || 'Error generating plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!previewPlan) return;
    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch('/api/planner/apply-generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: previewPlan,
          tasks: previewTasks,
          goal: previewGoal,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to apply generated plan.');
      }

      const data = await res.json();
      onPlanGeneratedAndApplied(data.plan, data.tasks);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error applying plan.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-lg">
                  AI Study Plan Generator
                </h3>
                <p className="text-xs text-slate-400">
                  Step {step} of 4 • Diagnostic & Pacing Architecture
                </p>
              </div>
            </div>
            <button
              id="btn-close-ai-plan-wizard"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progression Bar */}
          <div className="grid grid-cols-4 gap-2 my-4 shrink-0">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                    : s < step
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto pr-1">
            {/* STEP 1: GOAL & EXAM TRACK */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    1. Study Goal Title
                  </label>
                  <input
                    id="input-ai-goal-title"
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. 30-Day Calculus & Data Structures Sprint"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    2. Target Exam Track / Curriculum Focus
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXAM_TRACKS.map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() => setTargetExamTrack(track)}
                        className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          targetExamTrack === track
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Target Milestone Date
                    </label>
                    <input
                      id="input-ai-target-date"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Target Subjects
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SUBJECTS.map((sub) => {
                        const isSelected = selectedSubjects.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubject(sub.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <span className="mr-1">{sub.icon}</span> {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SCHEDULE & TIME CONSTRAINTS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Available Study Days
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const active = availableDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDay(d.id)}
                          className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            active
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Daily Available Study Time
                      </label>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {dailyAvailableMinutes} mins ({Math.floor(dailyAvailableMinutes / 60)}h{' '}
                        {dailyAvailableMinutes % 60}m)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="240"
                      step="15"
                      value={dailyAvailableMinutes}
                      onChange={(e) => setDailyAvailableMinutes(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>30m</span>
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                      <span>4h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1.5">
                        Preferred Start Time
                      </label>
                      <input
                        type="time"
                        value={preferredStartTime}
                        onChange={(e) => setPreferredStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1.5">
                        Single Session Length
                      </label>
                      <select
                        value={preferredSessionLength}
                        onChange={(e) => setPreferredSessionLength(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value={30}>30 mins (Quick Sprint)</option>
                        <option value={45}>45 mins (Balanced Focus)</option>
                        <option value={60}>60 mins (Deep Derivation)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PEDAGOGY & ADAPTATION */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <label
                    onClick={() =>
                      setIncludeWeakMistakeRemediation(!includeWeakMistakeRemediation)
                    }
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={includeWeakMistakeRemediation}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        Include Weak-Topic & Mistake Remediation
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Analyzes your logged mistake history to automatically insert diagnostic drills
                        and targeted concept reviews.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setIncludeSpacedRevision(!includeSpacedRevision)}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={includeSpacedRevision}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        Automate Spaced Repetition (Ebbinghaus Intervals)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Injects scheduled review cycles (Day 3, Day 7, Day 14) to cement neural
                        consolidation and prevent retention decay.
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Custom Prompt or Special Instructions
                  </label>
                  <textarea
                    id="input-ai-custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Prioritize vector spaces and matrices before multivariable calculus; keep weekends lighter..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  />
                </div>

                {/* Daily limit reminder */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    The AI enforces Learn.co's <strong>25 questions/day limit</strong> across all
                    calibrated practice drills.
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PREVIEW & APPLY */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
                    <h4 className="text-sm font-semibold text-slate-200">
                      Synthesizing Paced Study Architecture...
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      Pacing concepts across {selectedSubjects.join(', ').toUpperCase()}, validating
                      daily question caps, and interleaving mistake remediation.
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Plan Generation Error</p>
                      <p className="mt-0.5">{error}</p>
                      <button
                        onClick={handleGeneratePlan}
                        className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-500"
                      >
                        Retry Generation
                      </button>
                    </div>
                  </div>
                ) : (
                  previewPlan && (
                    <div className="space-y-4">
                      {/* Plan Summary Card */}
                      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-indigo-200">
                            {previewPlan.title}
                          </h4>
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-500/20 text-indigo-300">
                            {previewPlan.totalTasksCount} Scheduled Tasks
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          {previewPlan.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-indigo-500/20 text-xs text-slate-300">
                          <span>
                            ⏳ <strong>{previewPlan.totalEstimatedHours}h</strong> Total Study Time
                          </span>
                          <span>
                            📅 Target: <strong>{previewPlan.targetEndDate}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Generated Tasks List */}
                      <div>
                        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Scheduled Tasks Preview ({previewTasks.length})
                        </h5>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {previewTasks.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-slate-400 text-[11px] shrink-0">
                                  {t.scheduledDate}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 uppercase shrink-0">
                                  {t.subjectId}
                                </span>
                                <span className="font-medium text-slate-200 truncate">
                                  {t.title}
                                </span>
                              </div>
                              <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                                {t.estimatedDurationMinutes}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 shrink-0">
            {step > 1 && step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : step === 3 ? (
              <button
                id="btn-trigger-ai-generate"
                type="button"
                onClick={handleGeneratePlan}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/30 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Generate AI Study Plan
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Configure & Regenerate
                </button>
                <button
                  id="btn-apply-ai-plan"
                  type="button"
                  disabled={isApplying || !previewPlan}
                  onClick={handleApplyPlan}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Apply to My Schedule
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
