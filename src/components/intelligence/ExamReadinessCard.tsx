import React from 'react';
import {
  ShieldCheck,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { ExamReadinessEstimate } from '../../types/analytics';
import { ExamTrackId } from '../../types/curriculum';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

interface ExamReadinessCardProps {
  readiness: ExamReadinessEstimate;
  selectedTrack?: ExamTrackId;
  onSelectTrack?: (track: ExamTrackId) => void;
  onNavigateTab?: (tab: string, context?: any) => void;
}

export const ExamReadinessCard: React.FC<ExamReadinessCardProps> = ({
  readiness,
  selectedTrack,
  onSelectTrack,
  onNavigateTab,
}) => {
  const getBandBadge = (band: ExamReadinessEstimate['readinessBand']) => {
    switch (band) {
      case 'BENCHMARK_READY':
      case 'HIGH_CONFIDENCE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            BENCHMARK READY
          </span>
        );
      case 'COMPETITIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            COMPETITIVE STANDING
          </span>
        );
      case 'DEVELOPING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            DEVELOPING
          </span>
        );
      case 'FOUNDATIONAL':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            FOUNDATIONAL
          </span>
        );
    }
  };

  const tracks: { id: ExamTrackId; name: string }[] = [
    { id: 'jee_advanced', name: 'JEE Advanced' },
    { id: 'jee_main', name: 'JEE Main' },
    { id: 'ai_ml_foundations', name: 'AI & ML Foundations' },
    { id: 'ap_stem', name: 'AP STEM & Calculus' },
    { id: 'stem_olympiad', name: 'STEM Olympiad' },
  ];

  return (
    <Card variant="default" padding="lg" className="space-y-6">
      {/* Track Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Target Benchmark Simulation
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {readiness.examName} Readiness Index
          </h3>
        </div>

        {onSelectTrack && (
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTrack(t.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  (selectedTrack || readiness.examTrack) === t.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Readiness Gauge & Sub-Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Composite Readiness Gauge */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 text-center space-y-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Circular Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${
                  readiness.estimatedReadinessScore >= 75
                    ? 'text-emerald-500'
                    : readiness.estimatedReadinessScore >= 50
                    ? 'text-indigo-500'
                    : 'text-amber-500'
                } transition-all duration-1000 ease-out`}
                strokeDasharray={`${readiness.estimatedReadinessScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
                {readiness.estimatedReadinessScore}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Readiness</span>
            </div>
          </div>
          <div>{getBandBadge(readiness.readinessBand)}</div>
        </div>

        {/* 4 Multi-Factor Sub-scores */}
        <div className="md:col-span-8 space-y-3.5">
          {/* Syllabus Coverage */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Syllabus Coverage (Weight: 35%)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {readiness.syllabusCoveragePercent}%
              </span>
            </div>
            <Progress value={readiness.syllabusCoveragePercent} color="indigo" size="sm" />
          </div>

          {/* Concept Mastery */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Empirical Concept Mastery (Weight: 35%)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {readiness.conceptMasteryPercent}%
              </span>
            </div>
            <Progress value={readiness.conceptMasteryPercent} color="emerald" size="sm" />
          </div>

          {/* Historical Accuracy */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                Calibrated Accuracy (Weight: 20%)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {readiness.accuracyScore !== null ? `${readiness.accuracyScore}%` : 'No attempts'}
              </span>
            </div>
            <Progress value={readiness.accuracyScore || 0} color="amber" size="sm" />
          </div>

          {/* Practice Volume */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                Practice Volume Calibration (Weight: 10%)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {readiness.practiceVolumeScore}%
              </span>
            </div>
            <Progress value={readiness.practiceVolumeScore} color="blue" size="sm" />
          </div>
        </div>
      </div>

      {/* Strengths & Critical Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Strengths */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Key High-Yield Strengths
          </div>
          {readiness.keyStrengthAreas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {readiness.keyStrengthAreas.map((s, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              Continue solving multi-step questions to establish verified strength clusters.
            </p>
          )}
        </div>

        {/* Gaps */}
        <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Critical Gap Areas Needing Focus
          </div>
          {readiness.criticalGaps.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {readiness.criticalGaps.map((g, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-lg bg-rose-100/70 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              No critical prerequisite deficits found for this track.
            </p>
          )}
        </div>
      </div>

      {/* Narrative & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-xl">
          "{readiness.summaryNarrative}"
        </p>

        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab('practice', {
                targetTrack: readiness.examTrack,
                difficultyMode: 'calibrated_ladder',
              });
            }
          }}
          className="text-xs shrink-0"
        >
          <span>Launch {readiness.examName} Ladder</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </Card>
  );
};
