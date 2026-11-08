import React, { useState } from 'react';
import { Zap, Flame, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { DifficultyLevel } from '../../types';
import { StreakModal } from '../common/StreakModal';

export const XPIndicator: React.FC<{ xp: number; showIcon?: boolean; className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  xp,
  showIcon = true,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 min-h-[36px] gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 min-h-[40px] gap-2',
    lg: 'text-base px-4 py-2 min-h-[44px] gap-2.5 font-bold',
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-[#FFB84D] border border-[#e09d3b] text-[#2D2A4A] font-black shadow-[0_2px_4px_rgba(255,184,77,0.2)] select-none ${sizeStyles[size]} ${className}`}
    >
      {showIcon && <Zap className="w-4 h-4 fill-[#2D2A4A] text-[#2D2A4A] shrink-0" />}
      <span>{xp.toLocaleString()} XP</span>
    </div>
  );
};

export const StreakIndicator: React.FC<{
  streak: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}> = ({
  streak,
  className = '',
  size = 'md',
  interactive = true,
  onClick,
}) => {
  const [showModal, setShowModal] = useState(false);

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 min-h-[36px] gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 min-h-[40px] gap-2',
    lg: 'text-base px-4 py-2 min-h-[44px] gap-2.5 font-bold',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (interactive) {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Click to view daily streak details & rules"
        className={`inline-flex items-center rounded-xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#FFB84D] text-[#2D2A4A] dark:text-[#F1EFFF] font-black shadow-[0_2px_4px_rgba(45,42,74,0.06)] select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer ${sizeStyles[size]} ${className}`}
      >
        <Flame className="w-4 h-4 fill-[#FF9F43] text-[#FF9F43] shrink-0" />
        <span>{streak}d Streak</span>
      </button>

      {showModal && <StreakModal isOpen={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
};

export const MasteryIndicator: React.FC<{ score: number; className?: string; showLabel?: boolean }> = ({
  score,
  className = '',
  showLabel = true,
}) => {
  let color = 'text-white bg-[#F25F5C] border-[#d64a47]';
  let label = 'Developing';

  if (score >= 80) {
    color = 'text-white bg-[#4CAF8E] border-[#3e9375]';
    label = 'Mastered';
  } else if (score >= 60) {
    color = 'text-white bg-[#6C5CE7] border-[#5b4bc4]';
    label = 'Proficient';
  } else if (score >= 40) {
    color = 'text-[#2D2A4A] bg-[#FFB84D] border-[#e09d3b]';
    label = 'Practicing';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-xs ${color} ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      <span>{score}%</span>
      {showLabel && <span className="opacity-90">• {label}</span>}
    </div>
  );
};

export const DifficultyBadge: React.FC<{ difficulty: DifficultyLevel; className?: string }> = ({
  difficulty,
  className = '',
}) => {
  const config = {
    easy: { label: 'Easy', bg: 'bg-[#4CAF8E] text-white border-[#3e9375]' },
    easy_medium: { label: 'Easy-Med', bg: 'bg-[#00B8A9] text-white border-[#009b8e]' },
    medium: { label: 'Medium', bg: 'bg-[#6C5CE7] text-white border-[#5b4bc4]' },
    medium_hard: { label: 'Med-Hard', bg: 'bg-[#FFB84D] text-[#2D2A4A] border-[#e09d3b]' },
    hard: { label: 'Hard', bg: 'bg-[#F25F5C] text-white border-[#d64a47]' },
  };

  const item = config[difficulty] || config.medium;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-xs ${item.bg} ${className}`}
    >
      {item.label}
    </span>
  );
};
