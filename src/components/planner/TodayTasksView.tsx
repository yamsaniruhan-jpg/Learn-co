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
import { useAuth } from '../../context/AuthContext';
import { loadUserStreak } from '../../utils/streakManager';
import { StreakModal } from '../common/StreakModal';
import { FormattedMathText } from '../common/FormattedMathText';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

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
  math: { bg: 'bg-[#6C5CE7]/10', text: 'text-[#6C5CE7] dark:text-[#A99DF5]', border: 'border-[#6C5CE7]/25' },
  cs: { bg: 'bg-[#00B8A9]/10', text: 'text-[#008C80] dark:text-[#4DE0D3]', border: 'border-[#00B8A9]/25' },
  physics: { bg: 'bg-[#FFB84D]/15', text: 'text-[#9A6300] dark:text-[#FFD68A]', border: 'border-[#FFB84D]/35' },
  chemistry: { bg: 'bg-[#4CAF8E]/15', text: 'text-[#247A5E] dark:text-[#7ADEC0]', border: 'border-[#4CAF8E]/35' },
  biology: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/25' },
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
  const [showStreakModal, setShowStreakModal] = useState(false);

  const { user, gamification } = useAuth();
  const streakData = loadUserStreak(user?.id || 'guest');
  const activeStreak = streakData.currentStreak || gamification?.currentStreak || 1;

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
        <div className="p-4 rounded-2xl bg-[#FFF8EB] dark:bg-[#2F281D] border border-[#FFB84D]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FFB84D]/20 text-[#9A6300] dark:text-[#FFD68A] shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]">
                {overdueTasks.length} Missed Study Task{overdueTasks.length > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-0.5">
                Past uncompleted sessions can be batch-rescheduled forward to keep your target exam
                pacing intact without streak penalty.
              </p>
            </div>
          </div>
          <button
            id="btn-batch-reschedule-overdue"
            onClick={onBatchRescheduleMissed}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#FFB84D] hover:bg-[#F0A432] text-[#2D2A4A] shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reschedule to Tomorrow</span>
          </button>
        </div>
      )}

      {/* Daily Progress & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B6890] dark:text-[#B4B0D5] mb-1">
            <span>Today&apos;s Task Completion</span>
            <span className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]">
              {completedCount}/{todayTasks.length} Done
            </span>
          </div>
          <div className="text-2xl font-bold text-[#2D2A4A] dark:text-[#F1EFFF] mb-2">
            {todayTasks.length > 0
              ? `${Math.round((completedCount / todayTasks.length) * 100)}%`
              : '0%'}
          </div>
          <div className="w-full bg-[#E3DFF5] dark:bg-[#3D3861] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#4CAF8E] h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B6890] dark:text-[#B4B0D5] mb-1">
            <span>Planned Workload</span>
            <span className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]">
              {plannedMinutes}m / {settings.dailyAvailableMinutes || 120}m Limit
            </span>
          </div>
          <div className="text-2xl font-bold text-[#6C5CE7] dark:text-[#A99DF5] mb-2">
            {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m
          </div>
          <div className="w-full bg-[#E3DFF5] dark:bg-[#3D3861] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent > 100 ? 'bg-rose-500' : 'bg-[#6C5CE7]'
              }`}
              style={{ width: `${Math.min(100, capacityPercent)}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setShowStreakModal(true)}
          className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#FFB84D]/60 transition-colors group"
          title="Click to view daily streak breakdown"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">Current Study Streak</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFB84D]/15 text-[#9A6300] dark:text-[#FFD68A]">
                ACTIVE
              </span>
            </div>
            <div className="text-2xl font-bold text-[#D98200] dark:text-[#FFB84D] flex items-center gap-1.5 mt-1">
              <Flame className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              <span>{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}</span>
            </div>
            <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] mt-1">
              {activeStreak === 1 ? 'Streak started today! Keep it going.' : 'Consecutive daily momentum'}
            </p>
          </div>
          <button
            id="btn-quick-add-task"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNewTask();
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] transition-all cursor-pointer"
          >
            + Add Task
          </button>
        </div>
      </div>

      {showStreakModal && (
        <StreakModal isOpen={showStreakModal} onClose={() => setShowStreakModal(false)} />
      )}

      {/* Filter and Tab Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((filter) => (
            <button
              key={filter}
              id={`filter-today-${filter.toLowerCase()}`}
              onClick={() => setSelectedFilter(filter)}
              className={`min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
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
            aria-label="Filter today's tasks by subject"
            className="min-h-[44px] px-3.5 py-2 bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] rounded-xl text-[#2D2A4A] dark:text-[#F1EFFF] text-xs font-medium"
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
          <EmptyState
            icon={<CheckCircle2 className="w-6 h-6 text-[#4CAF8E]" />}
            title="No tasks scheduled for today"
            description="You are all caught up. Add a study block below or generate a paced curriculum plan."
            action={
              <Button variant="primary" size="md" onClick={onOpenNewTask}>
                + Create Today&apos;s Task
              </Button>
            }
          />
        ) : (
          displayedTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const subStyle = SUBJECT_COLORS[task.subjectId] || SUBJECT_COLORS.math;

            return (
              <div
                key={task.id}
                className={`group p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-[#FFFFFF]/70 dark:bg-[#2A2647]/60 border-[#E3DFF5]/70 dark:border-[#3D3861]/70 opacity-80'
                    : 'bg-[#FFFFFF] dark:bg-[#2A2647] border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7]/40 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Completion Checkbox */}
                    <button
                      id={`btn-toggle-task-${task.id}`}
                      onClick={() => onToggleTaskStatus(task.id, task.status)}
                      aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                      className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center text-[#6B6890] hover:text-[#4CAF8E] transition-colors shrink-0 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[#4CAF8E] fill-[#4CAF8E]/15" />
                      ) : (
                        <Circle className="w-5 h-5 hover:stroke-[#4CAF8E]" />
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

                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] border border-[#E3DFF5] dark:border-[#3D3861]">
                          {task.taskType.replace(/_/g, ' ')}
                        </span>

                        {task.isSpacedRevision && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A99DF5]">
                            Spaced Repetition (Cycle {task.revisionCycle || 1})
                          </span>
                        )}

                        {task.priority === 'CRITICAL' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                            Critical Priority
                          </span>
                        )}
                        {task.priority === 'HIGH' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFB84D]/20 text-[#9A6300] dark:text-[#FFD68A]">
                            High Priority
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] line-clamp-1 ${
                          isDone ? 'line-through opacity-60' : ''
                        }`}
                      >
                        <FormattedMathText text={task.title} inline />
                      </h3>

                      {task.description && (
                        <div className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 line-clamp-2">
                          <FormattedMathText text={task.description} />
                        </div>
                      )}

                      {/* Time, Practice questions info */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {task.scheduledStartTime
                            ? `${task.scheduledStartTime} (${task.estimatedDurationMinutes}m)`
                            : `${task.estimatedDurationMinutes}m`}
                        </span>

                        {task.practiceQuestionCount && task.practiceQuestionCount > 0 && (
                          <span className="flex items-center gap-1 text-[#6C5CE7] dark:text-[#A99DF5] font-medium">
                            <Zap className="w-3.5 h-3.5 text-[#D98200] dark:text-[#FFB84D]" />
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
                        className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7]/10 hover:bg-[#6C5CE7] text-[#6C5CE7] dark:text-[#A99DF5] hover:text-white border border-[#6C5CE7]/25 text-xs font-semibold transition-all cursor-pointer"
                        title="Start Focus Study Mode"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Focus Mode</span>
                      </button>
                    )}

                    <button
                      id={`btn-edit-task-${task.id}`}
                      onClick={() => onEditTask(task)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] rounded-xl transition-colors cursor-pointer"
                      title="Edit Task"
                      aria-label="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      id={`btn-delete-task-${task.id}`}
                      onClick={() => onDeleteTask(task.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete Task"
                      aria-label="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
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
