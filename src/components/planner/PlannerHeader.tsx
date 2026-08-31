import React from 'react';
import {
  Sparkles,
  Plus,
  Zap,
  History,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { StudyPlan } from '../../types/planner';

interface PlannerHeaderProps {
  plan: StudyPlan | null;
  activeTab: 'my-plan' | 'today' | 'calendar' | 'goals' | 'progress' | 'settings';
  onTabChange: (tab: 'my-plan' | 'today' | 'calendar' | 'goals' | 'progress' | 'settings') => void;
  onOpenAiWizard: () => void;
  onOpenNewTask: () => void;
  onOpenFocusSession: () => void;
  onOpenVersionHistory: () => void;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  plan,
  activeTab,
  onTabChange,
  onOpenAiWizard,
  onOpenNewTask,
  onOpenFocusSession,
  onOpenVersionHistory,
}) => {
  const tabs = [
    { id: 'today', label: "Today's Tasks", icon: '⚡' },
    { id: 'my-plan', label: 'My Study Plan', icon: '🗺️' },
    { id: 'calendar', label: 'Calendar & Matrix', icon: '📅' },
    { id: 'goals', label: 'Milestone Goals', icon: '🎯' },
    { id: 'progress', label: 'Workload & Analytics', icon: '📊' },
    { id: 'settings', label: 'Planner Settings', icon: '⚙️' },
  ] as const;

  return (
    <div className="bg-slate-900 border-b border-slate-800 shrink-0">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Volume 8 • Study Planner
            </span>
            {plan && (
              <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active (v{plan.version})
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {plan?.title || 'Personalized Study Planner'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {plan?.description ||
              'Adaptive scheduling engine integrating concept mastery, practice drills, mistake remediation, and spaced retention.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {plan && (
            <button
              id="btn-version-history"
              onClick={onOpenVersionHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all shadow-sm"
              title="Plan Version History & Rollback"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History</span>
            </button>
          )}

          <button
            id="btn-start-focus-session-header"
            onClick={onOpenFocusSession}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 shadow-sm transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Focus Mode</span>
          </button>

          <button
            id="btn-new-task-header"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>

          <button
            id="btn-open-ai-planner-wizard"
            onClick={onOpenAiWizard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>AI Plan Generator</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-planner-${tab.id}`}
              onClick={() => onTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
