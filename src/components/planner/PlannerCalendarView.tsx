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
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg">{monthName}</h3>
            <p className="text-xs text-slate-400">Paced Curriculum & Diagnostic Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentMonthDate(new Date());
              setSelectedDateStr(new Date().toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout: Calendar on Left, Selected Day Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Matrix Grid */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-400 pb-3 mb-2 border-b border-slate-800">
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
              <div key={`blank-${i}`} className="h-20 sm:h-24 rounded-xl bg-slate-950/30 opacity-20" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dateTasks = tasksByDate[dateStr] || [];
              const dateConflicts = conflictsByDate[dateStr] || [];
              const totalMins = dateTasks.reduce(
                (sum, t) => sum + (t.estimatedDurationMinutes || 0),
                0
              );

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : isToday
                        ? 'bg-slate-800/80 border-indigo-500/40'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dateConflicts.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Scheduling Conflict" />
                    )}
                  </div>

                  {/* Task Pills / Dots */}
                  <div className="space-y-1 overflow-hidden">
                    {dateTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] font-medium px-1 py-0.5 rounded truncate ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-950/60 text-emerald-300 line-through opacity-70'
                            : 'bg-indigo-900/60 text-indigo-200'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dateTasks.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-medium block">
                        +{dateTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Day Pane */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Selected Day Schedule
              </span>
              <h4 className="text-sm font-bold text-white">{selectedDateStr}</h4>
            </div>
            <button
              id="btn-calendar-add-task"
              onClick={() => onOpenNewTaskForDate(selectedDateStr)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          {/* Conflict Warnings */}
          {selectedDateConflicts.length > 0 && (
            <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
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
              <div className="py-12 text-center text-xs text-slate-400">
                No tasks scheduled on this day.
              </div>
            ) : (
              selectedDateTasks.map((t) => {
                const isDone = t.status === 'COMPLETED';
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isDone
                        ? 'bg-slate-900/40 border-slate-800/40 opacity-70'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() => onToggleTaskStatus(t.id, t.status)}
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-700 text-slate-300 uppercase">
                              {t.subjectId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {t.scheduledStartTime || 'Flexible'} ({t.estimatedDurationMinutes}m)
                            </span>
                          </div>
                          <p
                            className={`font-semibold text-slate-100 line-clamp-1 ${
                              isDone ? 'line-through text-slate-400' : ''
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
                            className="p-1 text-indigo-400 hover:text-white rounded"
                            title="Focus Mode"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditTask(t)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
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

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Total Day Time:</span>
            <span className="font-semibold text-slate-200">
              {selectedDateTasks.reduce((s, t) => s + (t.estimatedDurationMinutes || 0), 0)} mins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
