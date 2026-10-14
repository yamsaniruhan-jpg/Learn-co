import React from 'react';
import {
  X,
  Trophy,
  ArrowUp,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  LEADERBOARD_STAGES,
  LeaderboardStage,
  LeaderboardSubstage,
  calculateStageFromXp,
  getWeeklyResetCountdown,
} from './stagesConfig';
import { Button } from '../ui/Button';

interface StagesLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserXp: number;
  currentUserStreak: number;
}

export const StagesLadderModal: React.FC<StagesLadderModalProps> = ({
  isOpen,
  onClose,
  currentUserXp,
  currentUserStreak,
}) => {
  if (!isOpen) return null;

  const currentInfo = calculateStageFromXp(currentUserXp);
  const countdown = getWeeklyResetCountdown();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white flex items-start justify-between border-b border-indigo-900/50">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-300 border border-white/15">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>10 Stages & 30 Substage Divisions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
              Competitive League Hierarchy
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
              Advance weekly through 10 ordered leagues, each containing 3 competitive divisions (III ➔ II ➔ I).
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Capsule & Weekly Promotion Rules */}
        <div className="p-4 sm:p-5 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-md shrink-0">
              {currentInfo.stage.badgeEmoji}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Your Current Standing</span>
                <span>•</span>
                <span className="text-orange-500 font-bold flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-orange-500" />
                  {currentUserStreak}d streak
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {currentInfo.substage.substageName} ({currentInfo.stage.name} League)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentUserXp.toLocaleString()} XP • {currentInfo.nextSubstage ? `${(currentInfo.nextSubstage.minXp - currentUserXp).toLocaleString()} XP to ${currentInfo.nextSubstage.substageName}` : 'Max Tier Achieved'}
              </p>
            </div>
          </div>

          {/* Weekly Countdown */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Weekly Promotion Cutoff:</span>
            </div>
            <span className="font-mono font-black text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </span>
          </div>
        </div>

        {/* Promotion Rules Legend */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Regular Leagues (Tiers 1–6):</span>
            <span className="text-slate-500 dark:text-slate-400">Top 10 Advance Weekly 🚀</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Elite Leagues (Tiers 7–10):</span>
            <span className="text-slate-500 dark:text-slate-400">Top 3 Advance Weekly 👑</span>
          </div>
        </div>

        {/* Scrollable Stage Ladder (Ordered 1 to 10 with 3 substages each) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {LEADERBOARD_STAGES.map((stage) => {
            const isUserCurrentStage = currentInfo.stage.id === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isUserCurrentStage
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Stage Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{stage.badgeEmoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Tier {stage.tierNumber} of 10
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                          {stage.name} League
                        </h4>
                        {isUserCurrentStage && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                            You Are Here
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
                    <span className={`px-2.5 py-1 rounded-xl font-bold ${
                      stage.promotionTopCount === 10
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    }`}>
                      Top {stage.promotionTopCount} Promoted Weekly
                    </span>
                  </div>
                </div>

                {/* 3 Substages (Divisions III, II, I) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
                  {stage.substages.map((substage) => {
                    const isUserCurrentSubstage = currentInfo.substage.id === substage.id;

                    return (
                      <div
                        key={substage.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 ${
                          isUserCurrentSubstage
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/50'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isUserCurrentSubstage
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            Division {substage.division}
                          </span>
                          <span className={`text-[10px] font-mono ${
                            isUserCurrentSubstage ? 'text-indigo-100' : 'text-slate-400'
                          }`}>
                            Rank {substage.levelOrder}/30
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-black">
                            {substage.substageName}
                          </div>
                          <div className={`text-[11px] font-medium ${
                            isUserCurrentSubstage ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {substage.maxXp > 900000
                              ? `${substage.minXp.toLocaleString()}+ XP`
                              : `${substage.minXp.toLocaleString()} – ${substage.maxXp.toLocaleString()} XP`}
                          </div>
                        </div>

                        <div className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                          isUserCurrentSubstage
                            ? 'border-white/20 text-indigo-100 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span>Cutoff: Top {substage.promotionCutoffRank}</span>
                          {isUserCurrentSubstage && (
                            <span className="flex items-center gap-1 bg-white text-indigo-950 px-2 py-0.5 rounded-full font-black text-[9px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Promotions & division updates are calculated automatically every Sunday at midnight UTC.
          </span>
          <Button variant="primary" onClick={onClose} size="sm">
            Close Ladder
          </Button>
        </div>
      </div>
    </div>
  );
};
