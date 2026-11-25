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
  onComplete: (durationSeconds: number, notes?: string, completed?: boolean) => Promise<void>;
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
    if (isOpen) {
      setSecondsElapsed(0);
      setIsActive(true);
      setNotes('');
      setCompletedCelebration(false);
    }
    if (task?.estimatedDurationMinutes) {
      setTargetMinutes(task.estimatedDurationMinutes);
    }
  }, [isOpen, task]);

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
    try {
      if (completed) {
        setCompletedCelebration(true);
        await new Promise((r) => setTimeout(r, 900));
      }
      await onComplete(secondsElapsed, notes, completed);
    } finally {
      setIsSubmitting(false);
      setCompletedCelebration(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-3xl shadow-[0_12px_36px_rgba(45,42,74,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-6 sm:p-8 text-[#2D2A4A] dark:text-[#F1EFFF] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E3DFF5] dark:border-[#3D3861]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-[#00B8A9]" />
              <div>
                <h3 className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF] text-lg">Focus Study Session</h3>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">Deep Work &amp; Practice Conditioning</p>
              </div>
            </div>
            <button
              id="btn-close-focus-session"
              type="button"
              onClick={() => handleFinish(false)}
              aria-label="Close focus session"
              className="p-2 rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-white hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Task Details */}
          <div className="my-5 p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#6C5CE7]/15 text-[#6C5CE7] dark:text-[#A598FF] border border-[#6C5CE7]/25">
                {task?.subjectId?.toUpperCase() || 'STEM'}
              </span>
              <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                {task?.taskType?.replace(/_/g, ' ') || 'LEARN CONCEPT'}
              </span>
            </div>
            <h4 className="text-base font-bold text-[#2D2A4A] dark:text-[#F1EFFF] line-clamp-1">
              {task?.title || 'Focused Study Sprint'}
            </h4>
            {task?.description && (
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Circular Progress & Big Timer Display */}
          <div className="flex flex-col items-center justify-center my-5">
            <div className="relative flex items-center justify-center w-52 h-52">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-[#E3DFF5] dark:text-[#1E1B33]"
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
                  className="text-[#6C5CE7] dark:text-[#8577ED] transition-all duration-500"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black font-mono tabular-nums text-[#2D2A4A] dark:text-white tracking-tight">
                  {formatTime(secondsElapsed)}
                </span>
                <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 tabular-nums">
                  Target: {targetMinutes} mins ({progressPercent}%)
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4 mt-5">
              <button
                id="btn-toggle-focus-timer"
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
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
                type="button"
                onClick={() => setSecondsElapsed(0)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-white transition-colors cursor-pointer"
                title="Reset Timer"
                aria-label="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scratchpad Notes */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-1.5">
              Session Insights &amp; Scratchpad Notes
            </label>
            <textarea
              id="input-focus-session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record key derivations, invariant notes, or questions to ask mentor..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] placeholder-[#8E8BAF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40 resize-none"
            />
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E3DFF5] dark:border-[#3D3861]">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6890] dark:text-[#B4B0D5]">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Earn up to +50 XP upon completion</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                id="btn-cancel-focus-session"
                type="button"
                onClick={() => handleFinish(false)}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Save &amp; Pause
              </button>
              <button
                id="btn-complete-focus-session"
                type="button"
                onClick={() => handleFinish(true)}
                disabled={isSubmitting}
                className="min-h-[44px] flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8577ED] hover:from-[#5B4BC4] hover:to-[#6C5CE7] text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
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
