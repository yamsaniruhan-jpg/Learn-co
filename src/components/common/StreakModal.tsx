import React from 'react';
import { Flame, ShieldCheck, Zap, Calendar, AlertCircle, CheckCircle2, Trophy, Clock } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { loadUserStreak, getWeeklyStreakPills, StreakData } from '../../utils/streakManager';
import { useAuth } from '../../context/AuthContext';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose }) => {
  const { user, gamification } = useAuth();
  const streakData: StreakData = loadUserStreak(user?.id || 'guest');
  const weeklyPills = getWeeklyStreakPills(streakData);

  const currentCount = streakData.currentStreak || gamification?.currentStreak || 1;
  const longestCount = Math.max(streakData.longestStreak || 1, currentCount);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Study Streak Status"
      description="Track consecutive learning days and maintain your daily STEM momentum."
      maxWidth="lg"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-100">
        {/* Main Fire Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/30 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 shrink-0">
            <Flame className="w-10 h-10 animate-bounce" />
            <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-slate-900 text-[10px] font-black text-amber-300 border border-amber-500/40">
              ACTIVE
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-orange-600 dark:text-orange-400 font-display">
                {currentCount} {currentCount === 1 ? 'Day' : 'Days'} Streak
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Today
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {currentCount === 1
                ? 'Your streak started today! Come back tomorrow to continue your streak to Day 2.'
                : `Awesome momentum! You have maintained a consecutive study streak for ${currentCount} days.`}
            </p>
          </div>
        </div>

        {/* 7-Day Weekly Calendar Tracker */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Past 7 Days Consistency</span>
            </span>
            <span className="text-slate-400 font-normal">
              Longest: <strong className="text-slate-700 dark:text-slate-200">{longestCount}d</strong>
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weeklyPills.map((pill, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  pill.isToday
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold ring-2 ring-orange-500/20'
                    : pill.isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-semibold">{pill.dayName}</span>
                <div className="my-1">
                  {pill.isCompleted || pill.isToday ? (
                    <Flame className={`w-4 h-4 ${pill.isToday ? 'fill-orange-500 text-orange-500' : 'fill-emerald-500 text-emerald-500'}`} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-dashed border-slate-300 dark:border-slate-600" />
                  )}
                </div>
                <span className="text-[9px] uppercase font-bold">
                  {pill.isToday ? 'Today' : pill.isCompleted ? 'Done' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Rules Card */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5 text-xs">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>How Your Streak Engine Operates</span>
          </h4>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 shrink-0">•</span>
              <span>
                <strong>Day 1 Start:</strong> Signing in or practicing today begins your active streak immediately.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 shrink-0">•</span>
              <span>
                <strong>Streak Continuation:</strong> When you return tomorrow (consecutive day), your streak increments by +1 without interruption.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-rose-600 shrink-0">•</span>
              <span>
                <strong>Break & Reset Rule:</strong> If more than one calendar day passes between active sessions, the streak breaks and restarts fresh at Day 1 upon your next sign in.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
