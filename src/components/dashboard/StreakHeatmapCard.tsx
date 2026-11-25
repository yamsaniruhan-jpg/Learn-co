import React, { useMemo, useState } from 'react';
import {
  Flame,
  Shield,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  Grid,
} from 'lucide-react';
import {
  StreakData,
  StreakHeatmapDay,
  StreakCalendarCell,
  getStreakHeatmapDays,
  getStreakMilestoneInfo,
  getStreakCalendarMonth,
} from '../../utils/streakManager';

interface StreakHeatmapCardProps {
  streakData: StreakData;
  compact?: boolean;
  onOpenStreakModal?: () => void;
}

type TelemetryItem = {
  dateKey: string;
  dayLabel: string;
  isActive: boolean;
  isToday: boolean;
  questionsSolved: number;
  xpEarned: number;
  minutesStudied: number;
};

const INTENSITY_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#8E8BAF] border-[#E3DFF5] dark:border-[#3D3861]',
  1: 'bg-[#DDD6FE] dark:bg-[#3E3385] text-[#2D2A4A] dark:text-[#F1EFFF] border-[#C4B5FD] dark:border-[#5547B2]',
  2: 'bg-[#A78BFA] dark:bg-[#6C5CE7] text-white border-[#8B5CF6] dark:border-[#8577ED]',
  3: 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white border-[#5B4BC4] dark:border-[#A497F7]',
  4: 'bg-[#FFB84D] dark:bg-[#FFB84D] text-[#2D2A4A] border-[#E09D3B] dark:border-[#FFD085]',
};

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const StreakHeatmapCard: React.FC<StreakHeatmapCardProps> = ({
  streakData,
  compact = false,
  onOpenStreakModal,
}) => {
  const now = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<'calendar' | 'heatmap'>('calendar');
  const [cursorMonth, setCursorMonth] = useState<{ year: number; month: number }>(() => ({
    year: now.getFullYear(),
    month: now.getMonth(),
  }));

  const days = useMemo(() => getStreakHeatmapDays(streakData, 84, now), [streakData, now]);
  const milestone = useMemo(() => getStreakMilestoneInfo(streakData), [streakData]);
  const calendarMonth = useMemo(
    () => getStreakCalendarMonth(streakData, cursorMonth.year, cursorMonth.month, now),
    [streakData, cursorMonth.year, cursorMonth.month, now]
  );

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const today = days[days.length - 1];
    return today ? today.dateKey : '';
  });

  // 12-week grid grouped into 12 columns x 7 rows
  const weeks = useMemo(() => {
    const cols: StreakHeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [days]);

  const activeDayCount = useMemo(() => days.filter((d) => d.isActive).length, [days]);
  const freezeShields = streakData.freezeDaysRemaining ?? 1;

  const activeTelemetry: TelemetryItem | null = useMemo(() => {
    const fromCalendar = calendarMonth.days.find((d) => d.dateKey === selectedDateKey);
    if (fromCalendar) return fromCalendar;
    const fromHeatmap = days.find((d) => d.dateKey === selectedDateKey);
    if (fromHeatmap) return fromHeatmap;
    return days[days.length - 1] || calendarMonth.days[0] || null;
  }, [calendarMonth.days, days, selectedDateKey]);

  const stepMonth = (delta: number) => {
    setCursorMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const isViewingCurrentMonth =
    cursorMonth.year === now.getFullYear() && cursorMonth.month === now.getMonth();

  const daysRemaining = Math.max(0, milestone.nextMilestone - milestone.current);

  return (
    <section
      aria-label="Study streak consistency tracker"
      className={`rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_1px_4px_rgba(45,42,74,0.05)] ${
        compact ? 'p-3.5 space-y-3' : 'p-3.5 sm:p-5 space-y-3.5'
      }`}
    >
      {/* Top Row: Streak Count, Brief Summary & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FFB84D] text-[#2D2A4A] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 fill-[#2D2A4A]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF] font-display tabular-nums">
                {milestone.current}-Day Streak
              </h3>
              <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
                Best {milestone.longest}d · {activeDayCount}/84d · {freezeShields} freeze
              </span>
            </div>
            <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] truncate">
              {daysRemaining === 0
                ? 'Top milestone reached — keep daily momentum active.'
                : `${daysRemaining} more day${daysRemaining === 1 ? '' : 's'} to reach your ${milestone.nextMilestone}-day milestone.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            role="tablist"
            aria-label="Streak view mode"
            className="inline-flex items-center p-0.5 rounded-lg bg-[#F0EDFA] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'calendar'}
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#FFFFFF] dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] shadow-xs'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A]'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'heatmap'}
              onClick={() => setViewMode('heatmap')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                viewMode === 'heatmap'
                  ? 'bg-[#FFFFFF] dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] shadow-xs'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A]'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>12 Weeks</span>
            </button>
          </div>

          {onOpenStreakModal && (
            <button
              type="button"
              onClick={onOpenStreakModal}
              className="px-2.5 py-1 rounded-lg border border-[#E3DFF5] dark:border-[#3D3861] text-[11px] font-bold text-[#6C5CE7] dark:text-[#A497F7] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
            >
              Rules
            </button>
          )}
        </div>
      </div>

      {/* Visual Streak Milestone Progress Bar */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums">
          <span className="text-[#2D2A4A] dark:text-[#F1EFFF]">
            Goal Progress: <span className="text-[#6C5CE7] dark:text-[#A497F7] font-bold">{milestone.nextMilestone}-Day Milestone</span>
          </span>
          <span className="text-[#6B6890] dark:text-[#B4B0D5] font-bold">
            {milestone.current}/{milestone.nextMilestone}d ({milestone.progressPercent}%)
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden border border-[#E3DFF5] dark:border-[#3D3861]">
          <div
            className="h-full rounded-full bg-[#6C5CE7] transition-all duration-300"
            style={{ width: `${Math.max(4, milestone.progressPercent)}%` }}
            role="progressbar"
            aria-label="Progress toward next streak milestone"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={milestone.progressPercent}
          />
        </div>

        <div className="flex items-center justify-between gap-1 text-[10px] font-bold tabular-nums text-[#6B6890] dark:text-[#B4B0D5]">
          {milestone.allMilestones.slice(0, 6).map((m) => {
            const reached = milestone.longest >= m || milestone.current >= m;
            return (
              <span
                key={`ms-${m}`}
                className={
                  reached
                    ? 'text-[#4CAF8E] dark:text-[#5AC29E] font-extrabold'
                    : m === milestone.nextMilestone
                    ? 'text-[#6C5CE7] dark:text-[#A497F7] font-extrabold'
                    : ''
                }
              >
                {reached ? `✓${m}d` : `${m}d`}
              </span>
            );
          })}
        </div>
      </div>

      {/* Calendar or 12-Week Grid Body (fits inside 375px with zero horizontal scroll) */}
      <div className="pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861] space-y-2">
        {viewMode === 'calendar' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                  {calendarMonth.monthLabel}
                </span>
                <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
                  · {calendarMonth.activeDaysCount} active
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMonth(-1)}
                  aria-label="Previous month"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepMonth(1)}
                  disabled={isViewingCurrentMonth}
                  aria-label="Next month"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] disabled:opacity-35 disabled:cursor-default cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 7-column Sun-Sat Calendar */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_INITIALS.map((label, idx) => (
                <span
                  key={`wd-${idx}`}
                  className="text-[10px] font-bold text-[#8E8BAF] py-0.5 select-none"
                >
                  {label}
                </span>
              ))}

              {Array.from({ length: calendarMonth.leadingEmptySlots }).map((_, idx) => (
                <div key={`pad-${idx}`} aria-hidden="true" className="h-8" />
              ))}

              {calendarMonth.days.map((cell: StreakCalendarCell) => {
                const isSelected = activeTelemetry?.dateKey === cell.dateKey;
                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={cell.isFuture}
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    aria-label={`${cell.dayLabel}: ${
                      cell.isActive
                        ? `${cell.questionsSolved} problems, ${cell.xpEarned} XP`
                        : 'No recorded activity'
                    }`}
                    className={`h-8 rounded-lg border text-[11px] font-bold tabular-nums flex items-center justify-center transition-colors ${
                      cell.isFuture
                        ? 'opacity-30 border-transparent text-[#8E8BAF] cursor-default'
                        : `${INTENSITY_CLASSES[cell.intensity]} cursor-pointer`
                    } ${
                      cell.isToday
                        ? 'ring-2 ring-[#6C5CE7] dark:ring-[#FFB84D]'
                        : isSelected
                        ? 'ring-2 ring-[#2D2A4A] dark:ring-[#F1EFFF]'
                        : ''
                    }`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={`week-${weekIdx}`} className="flex flex-col gap-1 min-w-0">
                  <span className="text-[9px] font-bold text-[#6B6890] dark:text-[#B4B0D5] text-center h-3 leading-none truncate">
                    {weekIdx === 0 || week[0]?.monthLabel !== weeks[weekIdx - 1]?.[0]?.monthLabel
                      ? week[0]?.monthLabel
                      : ''}
                  </span>
                  {week.map((day) => {
                    const isSelected = activeTelemetry?.dateKey === day.dateKey;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        aria-label={`${day.dayLabel}: ${
                          day.isActive
                            ? `${day.questionsSolved} problems, ${day.xpEarned} XP`
                            : 'No recorded activity'
                        }`}
                        title={`${day.dayLabel} — ${
                          day.isActive
                            ? `${day.questionsSolved} Qs, ${day.xpEarned} XP, ${day.minutesStudied}m`
                            : 'Inactive'
                        }`}
                        className={`w-full aspect-square rounded-[4px] border transition-transform cursor-pointer ${
                          INTENSITY_CLASSES[day.intensity]
                        } ${
                          day.isToday
                            ? 'ring-1 ring-[#6C5CE7] dark:ring-[#FFB84D]'
                            : isSelected
                            ? 'ring-1 ring-[#2D2A4A] dark:ring-[#F1EFFF]'
                            : ''
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single-line Compact Telemetry Footer + Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
          {activeTelemetry ? (
            <div className="flex flex-wrap items-center gap-2.5 tabular-nums min-w-0">
              <span className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                {activeTelemetry.dayLabel}
                {activeTelemetry.isToday ? ' (Today)' : ''}
              </span>
              <span className="inline-flex items-center gap-1">
                <Target className="w-3 h-3 text-[#00B8A9]" />
                {activeTelemetry.questionsSolved} Qs
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#FFB84D]" />
                {activeTelemetry.xpEarned} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#6C5CE7]" />
                {activeTelemetry.minutesStudied}m
              </span>
              {activeTelemetry.isActive && (
                <span className="inline-flex items-center gap-0.5 font-bold text-[#4CAF8E]">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
          ) : (
            <span>Tap any day to inspect telemetry</span>
          )}

          <div className="flex items-center gap-1 text-[10px] font-semibold shrink-0">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <span
                key={`legend-${lvl}`}
                className={`w-2.5 h-2.5 rounded-[3px] border ${INTENSITY_CLASSES[lvl]}`}
                aria-hidden="true"
              />
            ))}
            <span>Peak</span>
          </div>
        </div>
      </div>

      {/* Freeze shield brief note */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#6B6890] dark:text-[#B4B0D5] pt-0.5">
        <Shield className="w-3.5 h-3.5 text-[#00B8A9] shrink-0" />
        <span>
          {freezeShields > 0
            ? `${freezeShields} Streak Freeze shield active · Protects your streak if you miss 1 day.`
            : 'Complete a 7-day milestone to earn a Streak Freeze shield.'}
        </span>
      </div>
    </section>
  );
};
