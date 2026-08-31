import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { StudyTask, StudyScheduleSettings } from '../../types/planner';
import { SubjectId } from '../../types/curriculum';

interface TodayTasksViewProps {
  tasks: StudyTask[];
  allTasks: StudyTask[];
  settings: StudyScheduleSettings;
  onToggleTaskStatus: (taskId: string, currentStatus: string) => Promise<void>;
  onStartFocusSession: (task: StudyTask) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onRescheduleTask: (taskId: string, newDate: string) => Promise<void>;
  onBatchRescheduleMissed: () => Promise<void>;
  onOpenNewTask: () => void;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  math: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  cs: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  physics: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  chemistry: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  biology: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

export const TodayTasksView: React.FC<TodayTasksViewProps> = ({
  tasks,
  allTasks,
  settings,
  onToggleTaskStatus,
  onStartFocusSession,
  onEditTask,
  onDeleteTask,
  onRescheduleTask,
  onBatchRescheduleMissed,
  onOpenNewTask,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue tasks from previous days
  const overdueTasks = allTasks.filter(
    (t) => t.scheduledDate < todayStr && t.status !== 'COMPLETED' && t.status !== 'SKIPPED'
  );

  // Today's tasks filtering
  const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr);

  let displayedTasks = todayTasks;
  if (selectedFilter === 'PENDING') {
    displayedTasks = displayedTasks.filter((t) => t.status !== 'COMPLETED');
  } else if (selectedFilter === 'COMPLETED') {
    displayedTasks = displayedTasks.filter((t) => t.status === 'COMPLETED');
  }

  if (subjectFilter !== 'ALL') {
    displayedTasks = displayedTasks.filter((t) => t.subjectId === subjectFilter);
  }

  const completedCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const plannedMinutes = todayTasks.reduce(
    (sum, t) => sum + (t.estimatedDurationMinutes || 0),
    0
  );
  const completedMinutes = todayTasks
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.actualDurationMinutes || t.estimatedDurationMinutes || 0), 0);

  const capacityPercent = Math.min(
    100,
    Math.round((plannedMinutes / (settings.dailyAvailableMinutes || 120)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Overdue / Missed Tasks Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-200">
                {overdueTasks.length} Missed Study Task{overdueTasks.length > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Past uncompleted sessions can be batch-rescheduled forward to keep your target exam
                pacing intact without streak penalty.
              </p>
            </div>
          </div>
          <button
            id="btn-batch-reschedule-overdue"
            onClick={onBatchRescheduleMissed}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reschedule to Tomorrow</span>
          </button>
        </div>
      )}

      {/* Daily Progress & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Today's Task Completion</span>
            <span className="font-semibold text-slate-200">
              {completedCount}/{todayTasks.length} Done
            </span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {todayTasks.length > 0
              ? `${Math.round((completedCount / todayTasks.length) * 100)}%`
              : '0%'}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Planned Workload</span>
            <span className="font-semibold text-slate-200">
              {plannedMinutes}m / {settings.dailyAvailableMinutes || 120}m Limit
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-400 mb-2">
            {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent > 100 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, capacityPercent)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Current Study Streak</span>
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1.5 mt-1">
              <Flame className="w-6 h-6 fill-current" />
              <span>4 Days</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Complete today's tasks to maintain</p>
          </div>
          <button
            id="btn-quick-add-task"
            onClick={onOpenNewTask}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Filter and Tab Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((filter) => (
            <button
              key={filter}
              id={`filter-today-${filter.toLowerCase()}`}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'ALL' ? 'All Tasks' : filter === 'PENDING' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Subjects</option>
            <option value="math">Mathematics</option>
            <option value="cs">Computer Science</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {displayedTasks.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-semibold text-slate-200">No Tasks Scheduled for Today</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You are all caught up! Use the button below to schedule a new study session or use the
              AI Study Plan generator to pace your curriculum.
            </p>
            <button
              onClick={onOpenNewTask}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
            >
              + Create Today's Task
            </button>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const subStyle = SUBJECT_COLORS[task.subjectId] || SUBJECT_COLORS.math;

            return (
              <div
                key={task.id}
                className={`group p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Completion Checkbox */}
                    <button
                      id={`btn-toggle-task-${task.id}`}
                      onClick={() => onToggleTaskStatus(task.id, task.status)}
                      className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5 hover:stroke-emerald-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${subStyle.bg} ${subStyle.text} border ${subStyle.border}`}
                        >
                          {task.subjectId}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {task.taskType.replace(/_/g, ' ')}
                        </span>

                        {task.isSpacedRevision && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            🔄 Spaced Repetition (Cycle {task.revisionCycle || 1})
                          </span>
                        )}

                        {task.priority === 'CRITICAL' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Critical Priority
                          </span>
                        )}
                        {task.priority === 'HIGH' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            High Priority
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-semibold text-slate-100 line-clamp-1 ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Time, Practice questions info */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {task.scheduledStartTime
                            ? `${task.scheduledStartTime} (${task.estimatedDurationMinutes}m)`
                            : `${task.estimatedDurationMinutes}m`}
                        </span>

                        {task.practiceQuestionCount && task.practiceQuestionCount > 0 && (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            {task.practiceQuestionCount} Practice Questions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isDone && (
                      <button
                        id={`btn-start-focus-${task.id}`}
                        onClick={() => onStartFocusSession(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
                        title="Start Focus Study Mode"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Focus Mode</span>
                      </button>
                    )}

                    <button
                      id={`btn-edit-task-${task.id}`}
                      onClick={() => onEditTask(task)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-delete-task-${task.id}`}
                      onClick={() => onDeleteTask(task.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
