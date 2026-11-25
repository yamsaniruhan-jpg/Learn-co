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
import { FormattedMathText } from '../common/FormattedMathText';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

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
      <EmptyState
        icon={<Sparkles className="w-6 h-6" />}
        title="No active study plan"
        description="Generate a paced study plan with AI or add a study task to organize your curriculum."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              id="btn-myplan-ai-generate"
              variant="primary"
              size="md"
              onClick={onOpenAiWizard}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Plan with AI
            </Button>
            <Button variant="outline" size="md" onClick={onOpenNewTask}>
              + Create Task
            </Button>
          </div>
        }
      />
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
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#A99DF5]">
                ACTIVE PLAN
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] border border-[#E3DFF5] dark:border-[#3D3861]">
                Version {plan.version}
              </span>
              {plan.aiGenerated && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#00B8A9]/12 text-[#008C80] dark:text-[#4DE0D3]">
                  <Sparkles className="w-3 h-3" /> AI Optimized
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">{plan.title}</h2>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] max-w-2xl">{plan.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenVersionHistory}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] border border-[#E3DFF5] dark:border-[#3D3861] transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" /> History
            </button>
            <button
              onClick={onOpenAiWizard}
              className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Regenerate
            </button>
          </div>
        </div>

        {/* Plan Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#E3DFF5] dark:border-[#3D3861]">
          <div>
            <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">Total Paced Tasks</span>
            <div className="text-lg font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
              {plan.completedTasksCount} / {plan.totalTasksCount}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">Total Study Hours</span>
            <div className="text-lg font-bold text-[#6C5CE7] dark:text-[#A99DF5]">
              {plan.completedHours}h / {plan.totalEstimatedHours}h
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">Timeline</span>
            <div className="text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] mt-1">
              {plan.startDate} → {plan.targetEndDate}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">Subjects Included</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {plan.subjects.map((sub) => (
                <span
                  key={sub}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] uppercase"
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
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubjectFilter === 'ALL'
              ? 'bg-[#6C5CE7] text-white'
              : 'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
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
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${
                activeSubjectFilter === sub
                  ? 'bg-[#6C5CE7] text-white'
                  : 'bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
              }`}
            >
              {sub} ({count})
            </button>
          );
        })}
      </div>

      {/* Grouped Roadmap Schedule */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No tasks match this filter"
            description="Switch to All Subjects or create a new task to populate this schedule."
            action={
              <Button variant="outline" size="md" onClick={() => setActiveSubjectFilter('ALL')}>
                Show all subjects
              </Button>
            }
          />
        ) : (
          sortedDates.map((dateStr) => {
            const dateTasks = tasksByDate[dateStr];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const completedInDay = dateTasks.filter((t) => t.status === 'COMPLETED').length;

            return (
              <div
                key={dateStr}
                className={`p-5 rounded-2xl border transition-all ${
                  isToday
                    ? 'bg-[#FFFFFF] dark:bg-[#2A2647] border-[#6C5CE7]/50 shadow-sm'
                    : 'bg-[#FFFFFF] dark:bg-[#2A2647] border-[#E3DFF5] dark:border-[#3D3861]'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E3DFF5] dark:border-[#3D3861]">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#6C5CE7] dark:text-[#A99DF5]" />
                    <span className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">{dateStr}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#4CAF8E]/15 text-[#247A5E] dark:text-[#7ADEC0]">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
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
                            ? 'bg-[#F7F5FF]/70 dark:bg-[#1E1B33]/60 border-[#E3DFF5]/70 dark:border-[#3D3861]/60 opacity-75'
                            : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => onToggleTaskStatus(t.id, t.status)}
                            aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-[#6B6890] hover:text-[#4CAF8E] shrink-0 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-[#4CAF8E] fill-[#4CAF8E]/15" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A99DF5] uppercase">
                                {t.subjectId}
                              </span>
                              <span className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                                <FormattedMathText text={t.title} inline />
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[#6B6890] dark:text-[#B4B0D5] mt-1">
                              <span>
                                {t.scheduledStartTime || 'Flexible'} ({t.estimatedDurationMinutes}m)
                              </span>
                              {t.isSpacedRevision && (
                                <span className="text-[#6C5CE7] dark:text-[#A99DF5]">Spaced Repetition</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {!isDone && (
                            <button
                              onClick={() => onStartFocusSession(t)}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6C5CE7] dark:text-[#A99DF5] hover:bg-[#6C5CE7]/10 rounded-xl cursor-pointer"
                              title="Focus Mode"
                              aria-label="Focus Mode"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditTask(t)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] rounded-xl cursor-pointer"
                            aria-label="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(t.id)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-rose-600 rounded-xl cursor-pointer"
                            aria-label="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
