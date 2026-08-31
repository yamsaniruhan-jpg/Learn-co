import React from 'react';
import { WeakTopicSignal, SubjectId } from '../../types/curriculum';
import { AlertTriangle, Zap, RotateCcw, ShieldAlert, ArrowRight, Clock } from 'lucide-react';

interface WeakTopicsViewProps {
  weakTopics: WeakTopicSignal[];
  onStartTargetedDrill: (topicId: string, subjectId: SubjectId, topicTitle: string) => void;
}

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({
  weakTopics,
  onStartTargetedDrill,
}) => {
  const getDecayBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">Critical Decay</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">High Risk</span>;
      case 'moderate':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">Moderate</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 p-6 rounded-2xl border border-rose-900/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold">Algorithmic Weak Topics & Knowledge Decay</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Learn.co's Bayesian spaced-retention engine analyzes your accuracy rate and elapsed time between attempts to pinpoint foundational invariant gaps.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {weakTopics && weakTopics.length > 0 ? (
          weakTopics.map((topic) => (
            <div
              key={topic.topicId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {topic.subjectId}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {topic.topicTitle}
                  </span>
                  {getDecayBadge(topic.decayRisk)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Empirical Accuracy: <strong className="text-rose-500 font-mono">{topic.accuracyRate}%</strong> ({topic.incorrectAttempts} incorrect / {topic.totalAttempts} total)
                  </span>
                  <span>•</span>
                  <span>{topic.recommendedAction}</span>
                </div>
              </div>

              <button
                onClick={() => onStartTargetedDrill(topic.topicId, topic.subjectId, topic.topicTitle)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>Launch 5-Question Drill</span>
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No weak topic anomalies detected! Solve more questions to calibrate spaced retention.
          </div>
        )}
      </div>
    </div>
  );
};
