import React, { useState, useEffect, useCallback } from 'react';
import {
  StudyPlan,
  StudyTask,
  StudyGoal,
  StudyScheduleSettings,
  PlannerAnalytics,
  ScheduleConflict,
  PlannerAdaptationRecommendation,
} from '../../types/planner';
import { PlannerHeader } from './PlannerHeader';
import { TodayTasksView } from './TodayTasksView';
import { MyPlanView } from './MyPlanView';
import { PlannerCalendarView } from './PlannerCalendarView';
import { PlannerGoalsView } from './PlannerGoalsView';
import { PlannerProgressView } from './PlannerProgressView';
import { PlannerSettingsView } from './PlannerSettingsView';
import { AiPlanWizardModal } from './AiPlanWizardModal';
import { TaskModal } from './TaskModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { FocusSessionModal } from './FocusSessionModal';

export const PlannerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'today' | 'my-plan' | 'calendar' | 'goals' | 'progress' | 'settings'
  >('today');

  // Core Backend Data State
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [settings, setSettings] = useState<StudyScheduleSettings>({
    userId: 'user-1',
    availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    dailyAvailableMinutes: 120,
    preferredStartTime: '17:30',
    preferredEndTime: '20:30',
    preferredSessionLength: 45,
    breakDurationMinutes: 10,
    unavailablePeriods: [],
    autoRescheduleMissed: true,
    reminderNotifications: true,
    reminderMinutesBefore: 15,
    targetExamTrack: 'Advanced STEM Mastery',
  });
  const [analytics, setAnalytics] = useState<PlannerAnalytics>({
    totalPlannedMinutes: 0,
    completedMinutes: 0,
    plannedTasksCount: 0,
    completedTasksCount: 0,
    completionRatePercent: 0,
    consistencyStreakDays: 4,
    overdueTasksCount: 0,
    weakAreaTasksCount: 0,
    spacedRevisionTasksCount: 0,
    subjectBreakdown: {
      math: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      cs: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      physics: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      chemistry: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      biology: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
    },
    dailyWorkloadForecast: [],
  });
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [recommendations, setRecommendations] = useState<PlannerAdaptationRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<StudyTask | null>(null);

  // Fetch all planner data from API
  const fetchPlannerData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch current active plan
      const planRes = await fetch('/api/planner/active');
      let planData: StudyPlan | null = null;
      if (planRes.ok) {
        const d = await planRes.json();
        planData = d.plan || null;
        setActivePlan(planData);
      }

      // 2. Fetch tasks
      const tasksRes = await fetch('/api/planner/tasks');
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setTasks(d.tasks || []);
      }

      // 3. Fetch goals
      const goalsRes = await fetch('/api/planner/goals');
      if (goalsRes.ok) {
        const d = await goalsRes.json();
        setGoals(d.goals || []);
      }

      // 4. Fetch schedule settings
      const settingsRes = await fetch('/api/planner/settings');
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        if (d.settings) setSettings(d.settings);
      }

      // 5. Fetch analytics
      const analyticsRes = await fetch('/api/planner/analytics');
      if (analyticsRes.ok) {
        const d = await analyticsRes.json();
        if (d.analytics) setAnalytics(d.analytics);
      }

      // 6. Fetch conflicts
      const conflictsRes = await fetch('/api/planner/conflicts');
      if (conflictsRes.ok) {
        const d = await conflictsRes.json();
        setConflicts(d.conflicts || []);
      }

      // 7. Fetch adaptive recommendations
      const recsRes = await fetch('/api/planner/recommendations');
      if (recsRes.ok) {
        const d = await recsRes.json();
        setRecommendations(d.recommendations || []);
      }
    } catch (err) {
      console.error('Error loading study planner data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  // Task Status Toggle
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        // Refresh analytics in background
        const anRes = await fetch('/api/planner/analytics');
        if (anRes.ok) {
          const anData = await anRes.json();
          if (anData.analytics) setAnalytics(anData.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to toggle task status:', err);
      fetchPlannerData();
    }
  };

  // Save / Update Task
  const handleSaveTask = async (taskData: Partial<StudyTask>) => {
    try {
      if (editingTask) {
        const res = await fetch(`/api/planner/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (res.ok) {
          const updated = await res.json();
          setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated.task : t)));
        }
      } else {
        const res = await fetch('/api/planner/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            planId: activePlan?.id || undefined,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setTasks((prev) => [created.task, ...prev]);
        }
      }
      // Re-fetch analytics & conflicts
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to save study task:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await fetch(`/api/planner/tasks/${taskId}`, { method: 'DELETE' });
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Reschedule single task
  const handleRescheduleTask = async (taskId: string, newDate: string) => {
    try {
      const res = await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: newDate }),
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Failed to reschedule task:', err);
    }
  };

  // Batch Reschedule Missed Tasks
  const handleBatchRescheduleMissed = async () => {
    try {
      const res = await fetch('/api/planner/reschedule-missed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'NEXT_AVAILABLE_DAY' }),
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Failed to batch reschedule missed tasks:', err);
    }
  };

  // Save / Update Goal
  const handleSaveGoal = async (goalData: Partial<StudyGoal>) => {
    try {
      if (goalData.id) {
        const res = await fetch(`/api/planner/goals/${goalData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });
        if (res.ok) {
          const updated = await res.json();
          setGoals((prev) => prev.map((g) => (g.id === goalData.id ? updated.goal : g)));
        }
      } else {
        const res = await fetch('/api/planner/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });
        if (res.ok) {
          const created = await res.json();
          setGoals((prev) => [...prev, created.goal]);
        }
      }
    } catch (err) {
      console.error('Failed to save study goal:', err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      await fetch(`/api/planner/goals/${goalId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Save Schedule Settings
  const handleSaveSettings = async (updates: Partial<StudyScheduleSettings>) => {
    try {
      const res = await fetch('/api/planner/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings);
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Failed to update schedule settings:', err);
    }
  };

  // Plan Rollback
  const handleRollbackVersion = async (versionId: string) => {
    if (!activePlan) return;
    try {
      const res = await fetch(`/api/planner/rollback/${activePlan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Failed to rollback plan:', err);
    }
  };

  // Start Focus Session
  const handleStartFocusSession = (task: StudyTask) => {
    setFocusTask(task);
    setIsFocusModalOpen(true);
  };

  // Edit Task helper
  const handleEditTask = (task: StudyTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTaskForDate = (dateStr: string) => {
    setEditingTask({
      id: '',
      userId: 'user-1',
      title: '',
      taskType: 'LEARN_CONCEPT',
      subjectId: 'math',
      scheduledDate: dateStr,
      scheduledStartTime: '17:30',
      estimatedDurationMinutes: 45,
      priority: 'NORMAL',
      status: 'NOT_STARTED',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsTaskModalOpen(true);
  };

  // After AI Plan is applied
  const handlePlanGeneratedAndApplied = (newPlan: StudyPlan, newTasks: StudyTask[]) => {
    setActivePlan(newPlan);
    setTasks(newTasks);
    fetchPlannerData();
    setActiveTab('my-plan');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* Planner Header & Navigation Sub-tabs */}
      <PlannerHeader
        plan={activePlan}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAiWizard={() => setIsAiWizardOpen(true)}
        onOpenNewTask={handleOpenNewTask}
        onOpenFocusSession={() => {
          setFocusTask(tasks.find((t) => t.status !== 'COMPLETED') || tasks[0] || null);
          setIsFocusModalOpen(true);
        }}
        onOpenVersionHistory={() => setIsVersionModalOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Loading personalized timetable & metrics...</p>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <TodayTasksView
                tasks={tasks}
                allTasks={tasks}
                settings={settings}
                onToggleTaskStatus={handleToggleTaskStatus}
                onStartFocusSession={handleStartFocusSession}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onRescheduleTask={handleRescheduleTask}
                onBatchRescheduleMissed={handleBatchRescheduleMissed}
                onOpenNewTask={handleOpenNewTask}
              />
            )}

            {activeTab === 'my-plan' && (
              <MyPlanView
                plan={activePlan}
                tasks={tasks}
                goals={goals}
                onToggleTaskStatus={handleToggleTaskStatus}
                onStartFocusSession={handleStartFocusSession}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onOpenAiWizard={() => setIsAiWizardOpen(true)}
                onOpenNewTask={handleOpenNewTask}
                onOpenVersionHistory={() => setIsVersionModalOpen(true)}
              />
            )}

            {activeTab === 'calendar' && (
              <PlannerCalendarView
                tasks={tasks}
                conflicts={conflicts}
                settings={settings}
                onToggleTaskStatus={handleToggleTaskStatus}
                onStartFocusSession={handleStartFocusSession}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onOpenNewTaskForDate={handleOpenNewTaskForDate}
              />
            )}

            {activeTab === 'goals' && (
              <PlannerGoalsView
                goals={goals}
                onSaveGoal={handleSaveGoal}
                onDeleteGoal={handleDeleteGoal}
              />
            )}

            {activeTab === 'progress' && (
              <PlannerProgressView
                analytics={analytics}
                settings={settings}
                recommendations={recommendations}
                onApplyRecommendation={() => {
                  fetchPlannerData();
                }}
              />
            )}

            {activeTab === 'settings' && (
              <PlannerSettingsView settings={settings} onSaveSettings={handleSaveSettings} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AiPlanWizardModal
        isOpen={isAiWizardOpen}
        onClose={() => setIsAiWizardOpen(false)}
        onPlanGeneratedAndApplied={handlePlanGeneratedAndApplied}
      />

      <TaskModal
        task={editingTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
      />

      {activePlan && (
        <VersionHistoryModal
          planId={activePlan.id}
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          onRollback={handleRollbackVersion}
        />
      )}

      <FocusSessionModal
        task={focusTask}
        isOpen={isFocusModalOpen}
        onClose={() => {
          setIsFocusModalOpen(false);
          setFocusTask(null);
        }}
        onComplete={async (durationSeconds, notes) => {
          fetchPlannerData();
        }}
      />
    </div>
  );
};
