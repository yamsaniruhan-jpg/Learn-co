import React from 'react';
import { BarChart3, Trophy, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExamForecasterViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const ExamForecasterView: React.FC<ExamForecasterViewProps> = ({ onNavigateToTab }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-cyan-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-cyan-300 border border-white/15">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Predictive Grade Forecasting & Readiness Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            AI Exam Forecaster & Score Range
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Statistical projection of exam success based on your concept masteries, Ebbinghaus retention intervals, and diagnostic accuracy.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigateToTab('practice')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold shrink-0"
        >
          Practice Arena
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated SAT / ACT Math Score</span>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">770 - 790</div>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top 1% National Percentile Projection</span>
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AP Calculus BC Forecast</span>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">Score: 5 / 5</div>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>98.4% Mastery Confidence</span>
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organic Chemistry / JEE Readiness</span>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">92.8% Ready</div>
          <p className="text-xs text-cyan-600 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Low Error Rate in SN2 Mechanics</span>
          </p>
        </div>
      </div>
    </div>
  );
};
