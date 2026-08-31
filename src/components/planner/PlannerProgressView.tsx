import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  RotateCcw,
  Target,
} from 'lucide-react';
import {
  PlannerAnalytics,
  StudyScheduleSettings,
  PlannerAdaptationRecommendation,
} from '../../types/planner';

interface PlannerProgressViewProps {
  analytics: PlannerAnalytics;
  settings: StudyScheduleSettings;
  recommendations: PlannerAdaptationRecommendation[];
  onApplyRecommendation?: (rec: PlannerAdaptationRecommendation) => void;
}

export const PlannerProgressView: React.FC<PlannerProgressViewProps> = ({
  analytics,
  settings,
  recommendations,
  onApplyRecommendation,
}) => {
  const chartData = analytics.dailyWorkloadForecast.map((d) => ({
    date: d.date.slice(5), // MM-DD
    minutes: d.totalMinutes,
    isOverloaded: d.isOverloaded,
    tasksCount: d.tasksCount,
  }));

  const subjectData = Object.entries(analytics.subjectBreakdown).map(([sub, data]) => ({
    subject: sub.toUpperCase(),
    plannedMinutes: data.plannedMinutes,
    completedMinutes: data.completedMinutes,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {analytics.completionRatePercent}%
          </div>
          <p className="text-[11px] text-slate-400">
            {analytics.completedTasksCount} of {analytics.plannedTasksCount} tasks completed
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Consistency Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {analytics.consistencyStreakDays} Days
          </div>
          <p className="text-[11px] text-slate-400">Active study consistency</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mb-1">
            {Math.round((analytics.completedMinutes / 60) * 10) / 10}h
          </div>
          <p className="text-[11px] text-slate-400">
            of {Math.round((analytics.totalPlannedMinutes / 60) * 10) / 10}h planned
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Remediation & Spaced</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {analytics.weakAreaTasksCount + analytics.spacedRevisionTasksCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {analytics.weakAreaTasksCount} mistake reviews, {analytics.spacedRevisionTasksCount} spaced
          </p>
        </div>
      </div>

      {/* 7-Day Workload Forecast vs Daily Capacity */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white">7-Day Paced Workload Forecast</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily minutes scheduled vs configured capacity limit ({settings.dailyAvailableMinutes}m)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" /> Normal Load
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" /> Overload Alert
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="m" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`${value} mins`, 'Workload']}
              />
              <ReferenceLine
                y={settings.dailyAvailableMinutes || 120}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'Limit',
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'right',
                }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOverloaded ? '#f43f5e' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Adaptive AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/30 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Adaptive Study Recommendations</h4>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h5 className="font-semibold text-slate-100">{rec.title}</h5>
                  <p className="text-slate-400 mt-0.5">{rec.reason}</p>
                </div>

                {onApplyRecommendation && (
                  <button
                    onClick={() => onApplyRecommendation(rec)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shrink-0 transition-colors"
                  >
                    Apply Adjustment
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
