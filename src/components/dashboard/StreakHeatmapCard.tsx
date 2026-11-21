import React, { useMemo, useState } from 'react';
import { Flame, Shield, Trophy, Calendar, CheckCircle2, Clock, Zap, Target } from 'lucide-react';
import {
  StreakData,
  StreakHeatmapDay,
  getStreakHeatmapDays,
  getStreakMilestoneInfo,
} from '../../utils/streakManager';

interface StreakHeatmapCardProps {
  streakData: StreakData;
  compact?: boolean;
  onOpenStreakModal?: () => void;
}

const INTENSITY_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-[#F0EDFA] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861]',
  1: 'bg-[#D6CEFB] dark:bg-[#463B99] border-[#BFAEF9] dark:border-[#5D4FC4]',
  2: 'bg-[#9F92F3] dark:bg-[#6C5CE7] border-[#8675F0] dark:border-[#8577ED]',
  3: 'bg-[#6C5CE7] dark:bg-[#8577ED] border-[#5949D1] dark:border-[#A497F7]',
  4: 'bg-[#FFB84D] dark:bg-[#FFB84D] border-[#E09D3B] dark:border-[#FFD085]',
};

export const StreakHeatmapCard: React.FC<StreakHeatmapCardProps> = ({
  streakData,
  compact = false,
  onOpenStreakModal,
}) => {
  const days = useMemo(() => getStreakHeatmapDays(streakData, 84), [streakData]);
  const milestone = useMemo(() => getStreakMilestoneInfo(streakData), [streakData]);
  const [selectedDay, setSelectedDay] = useState<StreakHeatmapDay | null>(() => {
    return days[days.length - 1] || null;
  });

  // Group 84 days into 12 columns of 7 days for crisp desktop & mobile heatmap alignment
  const weeks = useMemo(() => {
    const cols: StreakHeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [days]);

  const activeDayCount = useMemo(() => days.filter((d) => d.isActive).length, [days]);
  const activeInspectorDay = selectedDay
    ? days.find((d) => d.dateKey === selectedDay.dateKey) || days[days.length - 1]
    : days[days.length - 1];

  const freezeShields = streakData.freezeDaysRemaining ?? 1;

  return (
    <div
      className={`rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_4px_16px_rgba(45,42,74,0.06)] ${
        compact ? 'p-4 space-y-3.5' : 'p-5 sm:p-6 space-y-5'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#FFB84D] text-[#2D2A4A] flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 fill-[#2D2A4A]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                12-Week Study Consistency
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#4CAF8E] text-white text-[10px] font-black tabular-nums">
                {activeDayCount}/84 Days Active
              </span>
            </div>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
              Synced across sessions &middot; Tap any day square to inspect daily telemetry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDFA] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums"
            title="Streak Freeze Shields protect your streak if you miss 1 day"
          >
            <Shield className="w-3.5 h-3.5 text-[#00B8A9]" />
            <span>{freezeShields} Freeze</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDFA] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums">
            <Trophy className="w-3.5 h-3.5 text-[#FFB84D]" />
            <span>Best: {milestone.longest}d</span>
          </div>
          {onOpenStreakModal && (
            <button
              type="button"
              onClick={onOpenStreakModal}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold transition cursor-pointer"
            >
              Streak Rules
            </button>
          )}
        </div>
      </div>

      {/* 12-Week Activity Heatmap Grid */}
      <div className="space-y-2.5">
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex items-start gap-2 min-w-full justify-between">
            <div className="flex items-center gap-1.5">
              {weeks.map((week, weekIdx) => (
                <div key={`week-${weekIdx}`} className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-[#6B6890] dark:text-[#B4B0D5] text-center h-3 leading-none">
                    {weekIdx === 0 || week[0]?.monthLabel !== weeks[weekIdx - 1]?.[0]?.monthLabel
                      ? week[0]?.monthLabel
                      : ''}
                  </span>
                  {week.map((day) => {
                    const isSelected = activeInspectorDay?.dateKey === day.dateKey;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        onMouseEnter={() => setSelectedDay(day)}
                        aria-label={`${day.dayLabel}: ${day.isActive ? `${day.questionsSolved} problems, ${day.xpEarned} XP` : 'No recorded study activity'}`}
                        title={`${day.dayLabel} — ${day.isActive ? `${day.questionsSolved} questions, ${day.xpEarned} XP, ${day.minutesStudied}m` : 'Inactive'}`}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[5px] border transition-transform cursor-pointer ${
                          INTENSITY_CLASSES[day.intensity]
                        } ${
                          day.isToday
                            ? 'ring-2 ring-[#6C5CE7] dark:ring-[#FFB84D] ring-offset-1 ring-offset-[#FFFFFF] dark:ring-offset-[#2A2647]'
                            : ''
                        } ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intensity Legend + Selected Day Telemetry Inspector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {activeInspectorDay && (
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-xs">
              <span className="font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>
                  {activeInspectorDay.dayLabel}
                  {activeInspectorDay.isToday ? ' (Today)' : ''}
                </span>
              </span>
              <span className="text-[#6B6890] dark:text-[#B4B0D5] flex items-center gap-1 tabular-nums">
                <Target className="w-3.5 h-3.5 text-[#00B8A9]" />
                <strong>{activeInspectorDay.questionsSolved}</strong> Qs
              </span>
              <span className="text-[#6B6890] dark:text-[#B4B0D5] flex items-center gap-1 tabular-nums">
                <Zap className="w-3.5 h-3.5 text-[#FFB84D]" />
                <strong>{activeInspectorDay.xpEarned}</strong> XP
              </span>
              <span className="text-[#6B6890] dark:text-[#B4B0D5] flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <strong>{activeInspectorDay.minutesStudied}</strong>m
              </span>
              {activeInspectorDay.isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#4CAF8E]">
                  <CheckCircle2 className="w-3 h-3" />
                  Recorded
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B6890] dark:text-[#B4B0D5] shrink-0">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <span
                key={`legend-${lvl}`}
                className={`w-3.5 h-3.5 rounded-[4px] border ${INTENSITY_CLASSES[lvl]}`}
                aria-hidden="true"
              />
            ))}
            <span>Peak</span>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums">
            Next Milestone: <strong className="text-[#6C5CE7] dark:text-[#A497F7]">{milestone.nextMilestone}-Day Scholar</strong>
          </span>
          <span className="font-black text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums">
            {milestone.current} / {milestone.nextMilestone} days ({milestone.progressPercent}%)
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#E3DFF5] dark:bg-[#2A2647] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#6C5CE7] transition-all duration-300"
            style={{ width: `${milestone.progressPercent}%` }}
            role="progressbar"
            aria-label="Progress toward next streak milestone"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={milestone.progressPercent}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {milestone.allMilestones.slice(0, 6).map((m) => {
            const achieved = milestone.longest >= m;
            return (
              <span
                key={`ms-${m}`}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums border ${
                  achieved
                    ? 'bg-[#4CAF8E] text-white border-[#3E9375]'
                    : 'bg-[#FFFFFF] dark:bg-[#2A2647] text-[#6B6890] dark:text-[#B4B0D5] border-[#E3DFF5] dark:border-[#3D3861]'
                }`}
              >
                {m}d
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
