import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Play,
  Edit2,
  Trash2,
} from 'lucide-react';
import { StudyTask, ScheduleConflict, StudyScheduleSettings } from '../../types/planner';
import { EmptyState } from '../ui/EmptyState';

interface PlannerCalendarViewProps {
  tasks: StudyTask[];
  conflicts: ScheduleConflict[];
  settings: StudyScheduleSettings;
  onToggleTaskStatus: (taskId: string, currentStatus: string) => Promise<void>;
  onStartFocusSession: (task: StudyTask) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenNewTaskForDate: (date: string) => void;
}

export const PlannerCalendarView: React.FC<PlannerCalendarViewProps> = ({
  tasks,
  conflicts,
  settings,
  onToggleTaskStatus,
  onStartFocusSession,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskForDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Group tasks by date
  const tasksByDate: Record<string, StudyTask[]> = {};
  tasks.forEach((t) => {
    if (!tasksByDate[t.scheduledDate]) tasksByDate[t.scheduledDate] = [];
    tasksByDate[t.scheduledDate].push(t);
  });

  // Group conflicts by date
  const conflictsByDate: Record<string, ScheduleConflict[]> = {};
  conflicts.forEach((c) => {
    if (!conflictsByDate[c.date]) conflictsByDate[c.date] = [];
    conflictsByDate[c.date].push(c);
  });

  const selectedDateTasks = tasksByDate[selectedDateStr] || [];
  const selectedDateConflicts = conflictsByDate[selectedDateStr] || [];

  return (
    <div className="space-y-6">
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#A99DF5]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D2A4A] dark:text-[#F1EFFF] text-base sm:text-lg">{monthName}</h3>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">Paced Curriculum &amp; Diagnostic Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentMonthDate(new Date());
              setSelectedDateStr(new Date().toISOString().split('T')[0]);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] text-xs font-semibold cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] hover:bg-[#EDE9FE] dark:hover:bg-[#353059] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout: Calendar on Left, Selected Day Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Matrix Grid */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] pb-3 mb-2 border-b border-[#E3DFF5] dark:border-[#3D3861]">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 sm:h-24 rounded-xl bg-[#F7F5FF]/50 dark:bg-[#1E1B33]/40 opacity-40" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dateTasks = tasksByDate[dateStr] || [];
              const dateConflicts = conflictsByDate[dateStr] || [];

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#6C5CE7]/12 dark:bg-[#8577ED]/20 border-[#6C5CE7] ring-1 ring-[#6C5CE7]'
                      : isToday
                        ? 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#6C5CE7]/40'
                        : 'bg-[#F7F5FF]/60 dark:bg-[#1E1B33]/70 border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7]/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center'
                          : 'text-[#2D2A4A] dark:text-[#F1EFFF]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dateConflicts.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Scheduling Conflict" />
                    )}
                  </div>

                  {/* Task Pills / Dots */}
                  <div className="space-y-1 overflow-hidden w-full">
                    {dateTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] font-medium px-1 py-0.5 rounded truncate ${
                          t.status === 'COMPLETED'
                            ? 'bg-[#4CAF8E]/15 text-[#247A5E] dark:text-[#7ADEC0] line-through opacity-75'
                            : 'bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#A99DF5]'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dateTasks.length > 2 && (
                      <span className="text-[9px] text-[#6B6890] dark:text-[#B4B0D5] font-medium block">
                        +{dateTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Day Pane */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3DFF5] dark:border-[#3D3861]">
            <div>
              <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider font-semibold">
                Selected Day Schedule
              </span>
              <h4 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">{selectedDateStr}</h4>
            </div>
            <button
              id="btn-calendar-add-task"
              onClick={() => onOpenNewTaskForDate(selectedDateStr)}
              className="min-h-[44px] flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          {/* Conflict Warnings */}
          {selectedDateConflicts.length > 0 && (
            <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
              {selectedDateConflicts.map((c) => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>{c.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Day Task List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
            {selectedDateTasks.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon className="w-5 h-5" />}
                title="No tasks on this day"
                description="Use Add Task above to schedule a study session for this date."
              />
            ) : (
              selectedDateTasks.map((t) => {
                const isDone = t.status === 'COMPLETED';
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isDone
                        ? 'bg-[#F7F5FF]/60 dark:bg-[#1E1B33]/60 border-[#E3DFF5]/70 dark:border-[#3D3861]/60 opacity-75'
                        : 'bg-[#F7F5FF] dark:bg-[#1E1B33] border-[#E3DFF5] dark:border-[#3D3861]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() => onToggleTaskStatus(t.id, t.status)}
                          aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                          className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center text-[#6B6890] hover:text-[#4CAF8E] shrink-0 cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#4CAF8E] fill-[#4CAF8E]/15" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#A99DF5] uppercase">
                              {t.subjectId}
                            </span>
                            <span className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5]">
                              {t.scheduledStartTime || 'Flexible'} ({t.estimatedDurationMinutes}m)
                            </span>
                          </div>
                          <p
                            className={`font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] line-clamp-1 ${
                              isDone ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {t.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isDone && (
                          <button
                            onClick={() => onStartFocusSession(t)}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#6C5CE7] dark:text-[#A99DF5] rounded-lg hover:bg-[#6C5CE7]/10 cursor-pointer"
                            title="Focus Mode"
                            aria-label="Focus Mode"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditTask(t)}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] rounded-lg cursor-pointer"
                          aria-label="Edit task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(t.id)}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#6B6890] dark:text-[#B4B0D5] hover:text-rose-600 rounded-lg cursor-pointer"
                          aria-label="Delete task"
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

          <div className="pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861] text-xs text-[#6B6890] dark:text-[#B4B0D5] flex justify-between">
            <span>Total Day Time:</span>
            <span className="font-semibold text-[#2D2A4A] dark:text-[#F1EFFF]">
              {selectedDateTasks.reduce((s, t) => s + (t.estimatedDurationMinutes || 0), 0)} mins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
