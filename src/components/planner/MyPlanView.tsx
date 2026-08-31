import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Layers,
  History,
  Tag,
  Flame,
  ArrowRight,
  Plus,
  Play,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { StudyPlan, StudyTask, StudyGoal } from '../../types/planner';

interface MyPlanViewProps {
  plan: StudyPlan | null;
  tasks: StudyTask[];
  goals: StudyGoal[];
  onToggleTaskStatus: (taskId: string, currentStatus: string) => Promise<void>;
  onStartFocusSession: (task: StudyTask) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenAiWizard: () => void;
  onOpenNewTask: () => void;
  onOpenVersionHistory: () => void;
}

export const MyPlanView: React.FC<MyPlanViewProps> = ({
  plan,
  tasks,
  goals,
  onToggleTaskStatus,
  onStartFocusSession,
  onEditTask,
  onDeleteTask,
  onOpenAiWizard,
  onOpenNewTask,
  onOpenVersionHistory,
}) => {
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('ALL');

  if (!plan) {
    return (
      <div className="py-16 text-center rounded-2xl bg-slate-900 border border-slate-800 p-8 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">No Active Study Plan</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Generate an intelligent, paced study plan with AI or create a custom milestone plan to
          organize your STEM curriculum.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            id="btn-myplan-ai-generate"
            onClick={onOpenAiWizard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Plan with AI</span>
          </button>
          <button
            onClick={onOpenNewTask}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            + Create Task
          </button>
        </div>
      </div>
    );
  }

  // Filter tasks
  const filteredTasks =
    activeSubjectFilter === 'ALL'
      ? tasks
      : tasks.filter((t) => t.subjectId === activeSubjectFilter);

  // Group tasks by scheduled date
  const tasksByDate: Record<string, StudyTask[]> = {};
  filteredTasks.forEach((t) => {
    if (!tasksByDate[t.scheduledDate]) tasksByDate[t.scheduledDate] = [];
    tasksByDate[t.scheduledDate].push(t);
  });

  const sortedDates = Object.keys(tasksByDate).sort();

  return (
    <div className="space-y-6">
      {/* Plan Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ACTIVE PLAN
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
                Version {plan.version}
              </span>
              {plan.aiGenerated && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3" /> AI Optimized
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{plan.title}</h2>
            <p className="text-xs text-slate-300 max-w-2xl">{plan.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenVersionHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5" /> History
            </button>
            <button
              onClick={onOpenAiWizard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Regenerate
            </button>
          </div>
        </div>

        {/* Plan Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-500/20">
          <div>
            <span className="text-[11px] text-slate-400">Total Paced Tasks</span>
            <div className="text-lg font-bold text-white">
              {plan.completedTasksCount} / {plan.totalTasksCount}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Total Study Hours</span>
            <div className="text-lg font-bold text-indigo-400">
              {plan.completedHours}h / {plan.totalEstimatedHours}h
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Timeline</span>
            <div className="text-xs font-semibold text-slate-200 mt-1">
              {plan.startDate} → {plan.targetEndDate}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Subjects Included</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {plan.subjects.map((sub) => (
                <span
                  key={sub}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubjectFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSubjectFilter === 'ALL'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Subjects ({tasks.length})
        </button>
        {plan.subjects.map((sub) => {
          const count = tasks.filter((t) => t.subjectId === sub).length;
          return (
            <button
              key={sub}
              onClick={() => setActiveSubjectFilter(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-all ${
                activeSubjectFilter === sub
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub} ({count})
            </button>
          );
        })}
      </div>

      {/* Grouped Roadmap Schedule */}
      <div className="space-y-6">
        {sortedDates.map((dateStr, idx) => {
          const dateTasks = tasksByDate[dateStr];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const completedInDay = dateTasks.filter((t) => t.status === 'COMPLETED').length;

          return (
            <div
              key={dateStr}
              className={`p-5 rounded-2xl border transition-all ${
                isToday
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-100">{dateStr}</span>
                  {isToday && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      TODAY
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {completedInDay}/{dateTasks.length} Completed •{' '}
                  {dateTasks.reduce((s, t) => s + (t.estimatedDurationMinutes || 0), 0)} mins
                </span>
              </div>

              {/* Tasks within date */}
              <div className="space-y-2.5">
                {dateTasks.map((t) => {
                  const isDone = t.status === 'COMPLETED';
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                        isDone
                          ? 'bg-slate-900/40 border-slate-800/40 opacity-65'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => onToggleTaskStatus(t.id, t.status)}
                          className="text-slate-500 hover:text-emerald-400 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-700 text-slate-300 uppercase">
                              {t.subjectId}
                            </span>
                            <span className="font-semibold text-slate-200 truncate">
                              {t.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>
                              🕒 {t.scheduledStartTime || 'Flexible'} ({t.estimatedDurationMinutes}m)
                            </span>
                            {t.isSpacedRevision && (
                              <span className="text-purple-300">🔄 Spaced Repetition</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {!isDone && (
                          <button
                            onClick={() => onStartFocusSession(t)}
                            className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg"
                            title="Focus Mode"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditTask(t)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
