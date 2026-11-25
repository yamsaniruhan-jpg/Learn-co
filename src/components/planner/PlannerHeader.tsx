import React from 'react';
import {
  Sparkles,
  Plus,
  Zap,
  History,
  Calendar,
  Layers,
  ChevronDown,
  Award,
} from 'lucide-react';
import { StudyPlan } from '../../types/planner';
import { useAuth } from '../../context/AuthContext';
import { XPIndicator } from '../ui/GamificationIndicators';

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
  const { gamification } = useAuth();
  const currentXp = gamification?.xp ?? 0;

  const tabs = [
    { id: 'today', label: "Today's Tasks", icon: '⚡' },
    { id: 'my-plan', label: 'My Study Plan', icon: '🗺️' },
    { id: 'calendar', label: 'Calendar & Matrix', icon: '📅' },
    { id: 'goals', label: 'Milestone Goals', icon: '🎯' },
    { id: 'progress', label: 'Workload & Analytics', icon: '📊' },
    { id: 'settings', label: 'Planner Settings', icon: '⚙️' },
  ] as const;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#2A2647] border-b border-[#E3DFF5] dark:border-[#3D3861] shrink-0">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-[#6C5CE7]/10 dark:bg-[#8577ED]/20 text-[#6C5CE7] dark:text-[#A99DF5]">
              Study Plan
            </span>
            <XPIndicator xp={currentXp} size="sm" />
            {plan && (
              <span className="flex items-center gap-1 text-xs text-[#6B6890] dark:text-[#B4B0D5] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#4CAF8E]" />
                Active (v{plan.version})
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2D2A4A] dark:text-[#F1EFFF] tracking-tight">
            {plan?.title || 'Personalized Study Planner'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6890] dark:text-[#B4B0D5] mt-0.5">
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
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] border border-[#E3DFF5] dark:border-[#3D3861] transition-all cursor-pointer"
              title="Plan Version History & Rollback"
            >
              <History className="w-3.5 h-3.5 text-[#6B6890] dark:text-[#B4B0D5]" />
              <span>History</span>
            </button>
          )}

          <button
            id="btn-start-focus-session-header"
            onClick={onOpenFocusSession}
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#8A5A00] dark:text-[#FFD68A] bg-[#FFB84D]/15 hover:bg-[#FFB84D]/25 border border-[#FFB84D]/40 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#D98200] dark:text-[#FFB84D] fill-current" />
            <span>Focus Mode</span>
          </button>

          <button
            id="btn-new-task-header"
            onClick={onOpenNewTask}
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] border border-[#E3DFF5] dark:border-[#3D3861] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>

          <button
            id="btn-open-ai-planner-wizard"
            onClick={onOpenAiWizard}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
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
              className={`min-h-[44px] flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-[#6C5CE7] text-[#6C5CE7] dark:text-[#A99DF5] bg-[#6C5CE7]/8 dark:bg-[#8577ED]/12'
                  : 'border-transparent text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
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
