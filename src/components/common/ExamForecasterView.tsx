import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, TrendingUp, ShieldCheck, Target, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnalyticsClient } from '../../services/analyticsClient';
import { LearnerAnalyticsDashboardData } from '../../types/analytics';

interface ExamForecasterViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const ExamForecasterView: React.FC<ExamForecasterViewProps> = ({ onNavigateToTab }) => {
  const [data, setData] = useState<LearnerAnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AnalyticsClient.getDashboard()
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load readiness forecast');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const readiness = data?.examReadiness;
  const activeSubjects = (data?.subjectSummaries || []).filter((s) => s.totalAttempts > 0);
  const isColdStart = !data || data.isColdStart || data.totalAttemptsCount === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-[#2D2A4A] via-[#262340] to-[#3B3278] text-white p-6 sm:p-8 shadow-xl border border-[#3D3861] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#A598FF] border border-white/15">
            <BarChart3 className="w-3.5 h-3.5 text-[#A598FF]" />
            <span>Predictive Grade Forecasting & Readiness Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            AI Exam Forecaster & Readiness Index
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Statistical projection of exam readiness calculated from your verified practice attempts, concept masteries, and syllabus coverage.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigateToTab('practice')}
          className="bg-[#6C5CE7] hover:bg-[#5A4BD1] text-white font-bold shrink-0"
        >
          Practice Arena
        </Button>
      </div>

      {isLoading ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-[#6C5CE7]" />
          <span>Calculating predictive exam readiness from telemetry...</span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sign in or start practicing to view personalized forecasts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{error}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => onNavigateToTab('practice')}>
            Start Diagnostic Practice
          </Button>
        </div>
      ) : isColdStart || !readiness ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No Diagnostic Telemetry Yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Complete practice questions in the Practice Arena to unlock real-time score forecasting, syllabus coverage tracking, and concept mastery bands.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => onNavigateToTab('practice')}>
            Launch First Diagnostic Drill
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {readiness.examName || 'Overall Exam Readiness'}
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {Math.round(readiness.estimatedReadinessScore)}%
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Band: {readiness.readinessBand.replace(/_/g, ' ')}</span>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Syllabus & Concept Mastery
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {Math.round(readiness.conceptMasteryPercent)}%
              </div>
              <p className="text-xs text-[#6C5CE7] dark:text-[#A598FF] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{Math.round(readiness.syllabusCoveragePercent)}% Syllabus Coverage</span>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Verified Diagnostic Accuracy
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {data.overallAccuracy !== null ? `${Math.round(data.overallAccuracy)}%` : 'N/A'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Across {data.totalAttemptsCount} Verified Attempts</span>
              </p>
            </div>
          </div>

          {readiness.summaryNarrative && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">Readiness Brief:</span>
              {readiness.summaryNarrative}
            </div>
          )}

          {activeSubjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSubjects.map((subj) => (
                <div
                  key={subj.subjectId}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {subj.name}
                    </span>
                    <span className="text-xs font-bold text-[#6C5CE7] dark:text-[#A598FF]">
                      {Math.round(subj.masteryPercentage)}% Mastery
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Accuracy: {subj.accuracyPercentage !== null ? `${Math.round(subj.accuracyPercentage)}%` : 'N/A'}</span>
                    <span>{subj.totalAttempts} attempts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

