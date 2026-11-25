import React, { useEffect, useState } from 'react';
import { Flame, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { loadUserStreak, StreakData } from '../../utils/streakManager';
import { StreakHeatmapCard } from '../dashboard/StreakHeatmapCard';
import { useAuth } from '../../context/AuthContext';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose }) => {
  const { user, gamification } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>(() =>
    loadUserStreak(user?.id || 'default_user')
  );

  useEffect(() => {
    const refresh = () => setStreakData(loadUserStreak(user?.id || 'default_user'));
    refresh();
    window.addEventListener('learnco_streak_updated', refresh);
    return () => window.removeEventListener('learnco_streak_updated', refresh);
  }, [user?.id, isOpen]);

  const currentCount = streakData.currentStreak || gamification?.currentStreak || 1;
  const longestCount = Math.max(streakData.longestStreak || 1, currentCount);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Study Streak"
      description="Consecutive learning days and milestone calendar."
      maxWidth="lg"
    >
      <div className="space-y-3.5 text-[#2D2A4A] dark:text-[#F1EFFF]">
        {/* Compact Status Summary */}
        <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFB84D] text-[#2D2A4A] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-[#2D2A4A]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-black font-display tabular-nums">
                  {currentCount} {currentCount === 1 ? 'Day' : 'Days'} Streak
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4CAF8E]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Today
                </span>
              </div>
              <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                Best streak: <strong className="tabular-nums">{longestCount}d</strong> · Come back tomorrow to reach Day {currentCount + 1}.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Calendar & Milestone Progress */}
        <StreakHeatmapCard streakData={streakData} compact />

        {/* Concise Rules */}
        <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2 text-xs">
          <h4 className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
            <span>How Streaks Work</span>
          </h4>
          <ul className="space-y-1.5 text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
            <li>
              <strong className="text-[#2D2A4A] dark:text-[#F1EFFF]">Start:</strong> Signing in or completing a drill starts Day 1 immediately.
            </li>
            <li>
              <strong className="text-[#2D2A4A] dark:text-[#F1EFFF]">Continue:</strong> Returning on the next calendar day increments your streak by +1.
            </li>
            <li>
              <strong className="text-[#2D2A4A] dark:text-[#F1EFFF]">Reset:</strong> Missing more than one full calendar day without a freeze resets the active streak to Day 1.
            </li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
