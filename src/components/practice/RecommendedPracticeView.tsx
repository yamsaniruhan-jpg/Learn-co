import React from 'react';
import { PracticeRecommendation, SubjectId } from '../../types/curriculum';
import { Sparkles, Zap, Clock, Award, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

interface RecommendedPracticeViewProps {
  recommendations: PracticeRecommendation[];
  onLaunchRecommendation: (rec: PracticeRecommendation) => void;
}

export const RecommendedPracticeView: React.FC<RecommendedPracticeViewProps> = ({
  recommendations,
  onLaunchRecommendation,
}) => {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'weakness_remediation':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Weakness Drill</span>;
      case 'exam_readiness':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Exam Benchmark</span>;
      case 'curriculum_progression':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">Next Concept</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Curated AI Practice Recommendations</span>
        </h3>
        <span className="text-xs text-slate-400">Personalized to your target exam & memory gaps</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:border-indigo-400 dark:hover:border-indigo-600"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {rec.subjectId}
                </span>
                {getTypeBadge(rec.type)}
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                {rec.title}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {rec.description}
              </p>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Why recommended: </span>
                {rec.reason}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{rec.estimatedMinutes}m</span>
                <span>•</span>
                <span className="text-amber-500 font-bold">+{rec.xpPotential} XP</span>
              </div>

              <button
                onClick={() => onLaunchRecommendation(rec)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Launch</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
