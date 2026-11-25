import React, { useState, useEffect } from 'react';
import {
  Award,
  Zap,
  Flame,
  Trophy,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEED_BADGES } from '../../data/seedData';
import { calculateLevelFromXp } from '../../types/auth';
import { Leaderboard } from '../leaderboard/Leaderboard';
import { loadUserStreak, StreakData } from '../../utils/streakManager';
import { StreakHeatmapCard } from '../dashboard/StreakHeatmapCard';

export const GamificationView: React.FC = () => {
  const { user, gamification } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>(() =>
    loadUserStreak(user?.id || 'default_user')
  );

  useEffect(() => {
    const refresh = () => setStreakData(loadUserStreak(user?.id || 'default_user'));
    refresh();
    window.addEventListener('learnco_streak_updated', refresh);
    return () => window.removeEventListener('learnco_streak_updated', refresh);
  }, [user?.id]);

  const xp = gamification?.xp ?? 0;
  const currentStreak = Math.max(streakData.currentStreak || 0, gamification?.currentStreak ?? 0);
  const longestStreak = Math.max(streakData.longestStreak || 0, gamification?.longestStreak ?? 0, currentStreak);

  const levelInfo = calculateLevelFromXp(xp);
  const currentTier =
    levelInfo.level >= 5
      ? 'Master Scholar'
      : levelInfo.level >= 3
      ? 'Gold Scholar'
      : levelInfo.level >= 2
      ? 'Silver Scholar'
      : 'Bronze Scholar';

  const evaluatedBadges = React.useMemo(
    () =>
      SEED_BADGES.map((badge) => {
        const unlocked =
          badge.id === 'badge-streak-3'
            ? longestStreak >= 3 || currentStreak >= 3
            : badge.id === 'badge-streak-7'
            ? longestStreak >= 7 || currentStreak >= 7
            : false;
        return { ...badge, unlocked, unlockedAt: unlocked ? 'Earned' : undefined };
      }),
    [currentStreak, longestStreak]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Compact Header & Key Metrics */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-5 space-y-3.5 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#6C5CE7] dark:text-[#A497F7]">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>XP &amp; Progression · {currentTier}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
              Scholar Progression &amp; Leaderboard
            </h1>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
              This device shows local activity points plus server practice XP. The leaderboard uses server scores; older awards may be unverified.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 tabular-nums">
            <div className="px-3 py-2 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" />
              <div>
                <span className="text-[10px] font-bold text-[#6B6890] dark:text-[#B4B0D5] block">Total XP</span>
                <span className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF]">{xp} XP</span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" />
              <div>
                <span className="text-[10px] font-bold text-[#6B6890] dark:text-[#B4B0D5] block">Streak</span>
                <span className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF]">{currentStreak} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Strip */}
        <div className="pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861] space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
            <span className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
              Level {levelInfo.level} · {levelInfo.xpRemainingToNextLevel} XP to Level {levelInfo.level + 1}
            </span>
            <span className="font-black text-[#6C5CE7] dark:text-[#A497F7]">{levelInfo.progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden">
            <div
              className="h-full bg-[#6C5CE7] rounded-full transition-all duration-300"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
            <span>Range: {levelInfo.currentLevelMinXp}–{levelInfo.nextLevelMinXp} XP</span>
            <span>Best Streak: {longestStreak}d</span>
            <span>Daily Practice: {gamification?.dailyQuestionsSolvedToday ?? 0} / 25</span>
          </div>
        </div>
      </div>

      {/* Redesigned Consistency Calendar & Streak Bar */}
      <StreakHeatmapCard streakData={streakData} />

      {/* Compact Badges & Cohort Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-5 space-y-3 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#FFB84D]" />
              <span>Earned &amp; Upcoming Badges</span>
            </h3>
            <span className="text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
              {evaluatedBadges.filter((b) => b.unlocked).length} of {evaluatedBadges.length} Unlocked
            </span>
          </div>

          <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
            Streak badges use this device&apos;s activity streak. Other badge criteria are not tracked yet and remain locked.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {evaluatedBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                  badge.unlocked
                    ? 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#6C5CE7]/40'
                    : 'bg-[#FFFFFF] dark:bg-[#2A2647] border-[#E3DFF5] dark:border-[#3D3861] opacity-75'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F0EDFA] dark:bg-[#24203E] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-center text-base shrink-0">
                  {badge.tier === 'gold' ? '🏆' : badge.tier === 'silver' ? '🥈' : '🥉'}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                      {badge.title}
                    </h4>
                    {badge.unlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF8E] shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-[#8E8BAF] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] line-clamp-2 leading-snug">
                    {badge.description}
                  </p>
                  <div className="text-[10px] font-semibold text-[#8E8BAF] pt-0.5">
                    {badge.tier} tier · {badge.unlocked ? `Unlocked (${badge.unlockedAt || 'Earned'})` : 'Locked'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <Leaderboard
            compact
            showPodium={false}
            showSearch={true}
            showPrivacyNotice={true}
            title="Cohort Standings"
            subtitle="XP leaderboard rankings with privacy guard."
          />
        </div>
      </div>
    </div>
  );
};
