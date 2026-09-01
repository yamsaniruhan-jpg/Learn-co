import React, { useState, useEffect } from 'react';
import {
  Award,
  Zap,
  Flame,
  ShieldCheck,
  Sparkles,
  Trophy,
  Lock,
  CheckCircle2,
  Calendar as CalendarIcon,
  Crown,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthClient } from '../../services/authClient';
import { SEED_BADGES } from '../../data/seedData';
import { calculateLevelFromXp } from '../../types/auth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Avatar } from '../ui/Avatar';
import { Leaderboard } from '../leaderboard/Leaderboard';

export const GamificationView: React.FC = () => {
  const { profile, gamification } = useAuth();

  const xp = gamification?.xp ?? 0;
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;

  const levelInfo = calculateLevelFromXp(xp);
  const currentTier =
    levelInfo.level >= 5
      ? 'Master Scholar'
      : levelInfo.level >= 3
      ? 'Gold Scholar'
      : levelInfo.level >= 2
      ? 'Silver Scholar'
      : 'Bronze Scholar';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Authoritative XP Economy & Progression</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Scholar Progression & Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Earn verified experience points through diagnostic practice (+5 XP), maintain daily streaks, and rank in your cohort.
          </p>
        </div>

        {/* Gamification Stats Bento */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total XP
              </span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {xp} XP
              </span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Streak
              </span>
              <span className="text-base font-black text-orange-600 dark:text-orange-400">
                {currentStreak} Days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress Hero Card */}
      <Card variant="elevated" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">
                Level {levelInfo.level} Scholar
              </Badge>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                ★ {currentTier}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              {levelInfo.xpRemainingToNextLevel} XP needed to reach Level {levelInfo.level + 1}
            </h3>
            <p className="text-xs text-slate-500">
              Solve {Math.ceil(levelInfo.xpRemainingToNextLevel / 5)} more practice questions (+5 XP each) to rank up.
            </p>
          </div>

          <div className="text-right flex md:flex-col items-center md:items-end justify-between">
            <span className="text-xs font-bold text-slate-400">Level Progression</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {levelInfo.progressPercent}%
            </span>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Level Range
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200">
              {levelInfo.currentLevelMinXp} – {levelInfo.nextLevelMinXp} XP
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Streak
            </span>
            <span className="text-sm font-black text-orange-500">
              {currentStreak} Days (Max: {longestStreak}d)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Daily Practice Limit
            </span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              {gamification?.dailyQuestionsSolvedToday ?? 0} / 25 Questions Solved
            </span>
          </div>
        </div>
      </Card>

      {/* Main 2-Column Layout: Badges vs Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Badges & Achievements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Earned & Upcoming Badges</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {SEED_BADGES.filter((b) => b.unlocked).length} of {SEED_BADGES.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SEED_BADGES.map((badge) => (
              <Card
                key={badge.id}
                variant={badge.unlocked ? 'elevated' : 'bordered'}
                padding="md"
                className={`space-y-3 transition-all ${
                  badge.unlocked
                    ? 'border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-white via-indigo-50/10 to-white dark:from-slate-900 dark:via-indigo-950/10 dark:to-slate-900'
                    : 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                      badge.unlocked
                        ? 'bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grayscale'
                    }`}
                  >
                    {badge.tier === 'gold' ? '🏆' : badge.tier === 'silver' ? '🥈' : '🥉'}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {badge.title}
                      </h4>
                      {badge.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="uppercase font-bold tracking-wider">{badge.tier} Tier</span>
                  <span>{badge.unlocked ? `Unlocked ${badge.unlockedAt || 'Aug 2026'}` : 'Locked'}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Live Server Leaderboard Component */}
        <div className="space-y-4">
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
