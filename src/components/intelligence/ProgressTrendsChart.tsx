import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Zap,
  Target,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProgressTrendPoint } from '../../types/analytics';
import { Card } from '../ui/Card';

interface ProgressTrendsChartProps {
  daily: ProgressTrendPoint[];
  weekly: ProgressTrendPoint[];
  monthly: ProgressTrendPoint[];
}

export const ProgressTrendsChart: React.FC<ProgressTrendsChartProps> = ({
  daily,
  weekly,
  monthly,
}) => {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const data = granularity === 'daily' ? daily : granularity === 'weekly' ? weekly : monthly;
  const maxSolved = Math.max(...data.map((d) => d.questionsSolved || 0), 10);

  return (
    <div className="space-y-6">
      {/* Top Header & Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Time-Series Analytics
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Accuracy & Retention Velocity Trajectory
          </h3>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGranularity(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                granularity === mode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Histogram / Trajectory Bars */}
      <Card variant="default" padding="lg" className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Accuracy (%) & Solved Volume ({granularity})
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Accuracy %
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Mastery Velocity
            </span>
          </div>
        </div>

        {/* Visual Chart Bars */}
        <div className="h-48 flex items-end gap-2 sm:gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto">
          {data.map((point, index) => {
            const heightPercent = Math.max(((point.questionsSolved || 0) / maxSolved) * 100, 15);
            const accuracy = point.accuracy !== null ? point.accuracy : 0;

            return (
              <div
                key={index}
                className="flex-1 min-w-[40px] flex flex-col items-center gap-2 group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-lg p-2 pointer-events-none whitespace-nowrap z-20 shadow-lg border border-slate-700">
                  <div className="font-bold">{point.label || point.date}</div>
                  <div>Accuracy: {point.accuracy !== null ? `${point.accuracy}%` : 'N/A'}</div>
                  <div>Solved: {point.questionsSolved} questions</div>
                  <div>Avg Mastery: {point.avgMasteryScore}%</div>
                </div>

                {/* Accuracy percentage indicator badge above bar */}
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  {point.accuracy !== null ? `${point.accuracy}%` : '-'}
                </span>

                {/* Dual bar representing volume and accuracy fill */}
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex flex-col justify-end overflow-hidden" style={{ height: `${heightPercent}%` }}>
                  <div
                    className={`w-full transition-all duration-500 ${
                      accuracy >= 80
                        ? 'bg-emerald-500'
                        : accuracy >= 60
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ height: `${accuracy}%` }}
                  />
                </div>

                {/* X-axis date label */}
                <span className="text-[10px] text-slate-400 font-mono transform -rotate-45 sm:rotate-0 origin-top-left sm:origin-center mt-1">
                  {point.label || (point.date.length > 5 ? point.date.slice(5) : point.date)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cognitive Retention / Ebbinghaus Insights Box */}
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Ebbinghaus Spaced Repetition Stability Model
            </h4>
            <p className="leading-relaxed">
              Retention decay follows $R(t) = e^{"{-t / S}"}$ where stability $S$ expands exponentially upon consecutive successful retrievals without hints. Solve spaced review tasks every 3–5 days to prevent retention drop below 60%.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
