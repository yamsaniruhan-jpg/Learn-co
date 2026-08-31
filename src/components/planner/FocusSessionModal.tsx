import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  BookOpen,
  HelpCircle,
  Award,
} from 'lucide-react';
import { StudyTask, StudyActiveSession } from '../../types/planner';

interface FocusSessionModalProps {
  task: StudyTask | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (durationSeconds: number, notes?: string) => Promise<void>;
}

export const FocusSessionModal: React.FC<FocusSessionModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [isActive, setIsActive] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(task?.estimatedDurationMinutes || 45);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedCelebration, setCompletedCelebration] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (task?.estimatedDurationMinutes) {
      setTargetMinutes(task.estimatedDurationMinutes);
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && isActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isActive]);

  if (!isOpen) return null;

  const totalTargetSeconds = targetMinutes * 60;
  const progressPercent = Math.min(100, Math.round((secondsElapsed / totalTargetSeconds) * 100));

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFinish = async (completed: boolean) => {
    setIsSubmitting(true);
    if (completed) {
      setCompletedCelebration(true);
      setTimeout(async () => {
        await onComplete(secondsElapsed, notes);
        setIsSubmitting(false);
        setCompletedCelebration(false);
        onClose();
      }, 1200);
    } else {
      await onComplete(secondsElapsed, notes);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="font-semibold text-slate-100 text-lg">Focus Study Session</h3>
                <p className="text-xs text-slate-400">Deep Work & Practice Conditioning</p>
              </div>
            </div>
            <button
              id="btn-close-focus-session"
              onClick={() => handleFinish(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Task Details */}
          <div className="my-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {task?.subjectId?.toUpperCase() || 'STEM'}
              </span>
              <span className="text-xs text-slate-400">
                {task?.taskType?.replace(/_/g, ' ') || 'LEARN CONCEPT'}
              </span>
            </div>
            <h4 className="text-base font-semibold text-slate-100 line-clamp-1">
              {task?.title || 'Focused Study Sprint'}
            </h4>
            {task?.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Circular Progress & Big Timer Display */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center w-52 h-52">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={578}
                  strokeDashoffset={578 - (578 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="text-indigo-500 transition-all duration-500"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold font-mono text-white tracking-tight">
                  {formatTime(secondsElapsed)}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Target: {targetMinutes} mins ({progressPercent}%)
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4 mt-6">
              <button
                id="btn-toggle-focus-timer"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Resume
                  </>
                )}
              </button>

              <button
                id="btn-reset-focus-timer"
                onClick={() => setSecondsElapsed(0)}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scratchpad Notes */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Session Insights & Scratchpad Notes
            </label>
            <textarea
              id="input-focus-session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record key derivations, invariant notes, or questions to ask mentor..."
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Earn up to +50 XP upon session completion</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                id="btn-cancel-focus-session"
                onClick={() => handleFinish(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Save & Pause
              </button>
              <button
                id="btn-complete-focus-session"
                onClick={() => handleFinish(true)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
              >
                {completedCelebration ? (
                  <>
                    <Award className="w-4 h-4 animate-bounce text-amber-300" /> XP Earned!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Complete Session
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
