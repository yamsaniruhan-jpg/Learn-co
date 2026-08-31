import React from 'react';
import { Zap, Flame, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { DifficultyLevel } from '../../types';

export const XPIndicator: React.FC<{ xp: number; showIcon?: boolean; className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  xp,
  showIcon = true,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold shadow-2xs select-none ${sizeStyles[size]} ${className}`}
    >
      {showIcon && <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />}
      <span>{xp.toLocaleString()} XP</span>
    </div>
  );
};

export const StreakIndicator: React.FC<{ streak: number; className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  streak,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-orange-500/10 dark:bg-orange-400/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-extrabold shadow-2xs select-none ${sizeStyles[size]} ${className}`}
    >
      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 shrink-0 animate-pulse" />
      <span>{streak}d Streak</span>
    </div>
  );
};

export const MasteryIndicator: React.FC<{ score: number; className?: string; showLabel?: boolean }> = ({
  score,
  className = '',
  showLabel = true,
}) => {
  let color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  let label = 'Emerging';

  if (score >= 85) {
    color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    label = 'Mastered';
  } else if (score >= 70) {
    color = 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    label = 'Proficient';
  } else if (score >= 50) {
    color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    label = 'Developing';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${color} ${className}`}>
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      <span>{score}%</span>
      {showLabel && <span className="opacity-80 font-normal">({label})</span>}
    </div>
  );
};

export const DifficultyBadge: React.FC<{ difficulty: DifficultyLevel; className?: string }> = ({
  difficulty,
  className = '',
}) => {
  const config = {
    easy: { label: 'Easy', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    easy_medium: { label: 'Easy-Med', bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
    medium: { label: 'Medium', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    medium_hard: { label: 'Med-Hard', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    hard: { label: 'Hard', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  };

  const current = config[difficulty] || config.medium;

  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg border ${current.bg} ${className}`}>
      {current.label}
    </span>
  );
};
