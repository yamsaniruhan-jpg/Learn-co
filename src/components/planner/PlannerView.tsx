import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  StudyPlan,
  StudyTask,
  StudyGoal,
  StudyScheduleSettings,
  PlannerAnalytics,
  ScheduleConflict,
  PlannerAdaptationRecommendation,
} from '../../types/planner';
import { PlannerClient } from '../../services/plannerClient';
import { PlannerHeader } from './PlannerHeader';
import { TodayTasksView } from './TodayTasksView';
import { MyPlanView } from './MyPlanView';
import { PlannerCalendarView } from './PlannerCalendarView';
import { PlannerGoalsView } from './PlannerGoalsView';
import { ChartSkeleton, ScreenSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';
const PlannerProgressView = lazy(() =>
  import('./PlannerProgressView').then((m) => ({ default: m.PlannerProgressView }))
);
import { PlannerSettingsView } from './PlannerSettingsView';
import { AiPlanWizardModal } from './AiPlanWizardModal';
import { TaskModal } from './TaskModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { FocusSessionModal } from './FocusSessionModal';
import { awardXp } from '../../utils/xpManager';
import { useAuth } from '../../context/AuthContext';

export const PlannerView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'today' | 'my-plan' | 'calendar' | 'goals' | 'progress' | 'settings'
  >('today');

  // Core Backend Data State
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [settings, setSettings] = useState<StudyScheduleSettings>({
    userId: user?.id || '',
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
    consistencyStreakDays: 0,
    overdueTasksCount: 0,
    weakAreaTasksCount: 0,
    spacedRevisionTasksCount: 0,
    subjectBreakdown: {
      math: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      cs: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      physics: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      chemistry: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      biology: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      english: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
      data_science: { plannedMinutes: 0, completedMinutes: 0, tasksCount: 0 },
    },
    dailyWorkloadForecast: [],
  });
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [recommendations, setRecommendations] = useState<PlannerAdaptationRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals state
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<StudyTask | null>(null);
  const [activeFocusSessionId, setActiveFocusSessionId] = useState<string | null>(null);

  // Fetch all planner data from API via PlannerClient
  const fetchPlannerData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const overview = await PlannerClient.getOverview();
      if (overview.plan) setActivePlan(overview.plan);
      if (overview.tasks) setTasks(overview.tasks);
      if (overview.goals) setGoals(overview.goals);
      if (overview.settings) setSettings(overview.settings);
      if (overview.analytics) setAnalytics(overview.analytics);
      if (overview.conflicts) setConflicts(overview.conflicts);
      if (overview.recommendations) setRecommendations(overview.recommendations);
    } catch (err: any) {
      console.error('Error loading study planner data:', err);
      setLoadError(err?.message || 'Could not load your study schedule. Please try again.');
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

    if (nextStatus === 'COMPLETED') {
      const taskObj = tasks.find((t) => t.id === taskId);
      awardXp(50, `Completed study task: ${taskObj?.title || 'Study Session'}`);
    }

    try {
      await PlannerClient.updateTaskStatus(taskId, nextStatus);
      const overview = await PlannerClient.getOverview();
      if (overview.analytics) setAnalytics(overview.analytics);
    } catch (err) {
      console.error('Failed to toggle task status:', err);
      fetchPlannerData();
    }
  };

  // Save / Update Task
  const handleSaveTask = async (taskData: Partial<StudyTask>) => {
    try {
      if (editingTask) {
        const updated = await PlannerClient.saveTask({ ...taskData, id: editingTask.id });
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const created = await PlannerClient.saveTask({
          ...taskData,
          planId: activePlan?.id || undefined,
        });
        setTasks((prev) => [created, ...prev]);
      }
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to save study task:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await PlannerClient.deleteTask(taskId);
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Reschedule single task
  const handleRescheduleTask = async (taskId: string, newDate: string) => {
    try {
      await PlannerClient.rescheduleTask(taskId, newDate);
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to reschedule task:', err);
    }
  };

  // Batch Reschedule Missed Tasks
  const handleBatchRescheduleMissed = async () => {
    try {
      await PlannerClient.batchRescheduleMissed();
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to batch reschedule missed tasks:', err);
    }
  };

  // Save / Update Goal
  const handleSaveGoal = async (goalData: Partial<StudyGoal>) => {
    try {
      const saved = await PlannerClient.saveGoal(goalData);
      if (goalData.id) {
        setGoals((prev) => prev.map((g) => (g.id === goalData.id ? saved : g)));
      } else {
        setGoals((prev) => [...prev, saved]);
      }
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to save study goal:', err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      await PlannerClient.deleteGoal(goalId);
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Save Schedule Settings
  const handleSaveSettings = async (updates: Partial<StudyScheduleSettings>) => {
    try {
      const updated = await PlannerClient.saveSettings(updates);
      setSettings(updated);
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to update schedule settings:', err);
    }
  };

  // Plan Rollback
  const handleRollbackVersion = async (versionId: string) => {
    if (!activePlan) return;
    try {
      await PlannerClient.rollbackPlan(activePlan.id, versionId);
      fetchPlannerData();
    } catch (err) {
      console.error('Failed to rollback plan:', err);
    }
  };

  // Start Focus Session
  const handleStartFocusSession = (task: StudyTask | null) => {
    setFocusTask(task);
    setActiveFocusSessionId(null);
    setIsFocusModalOpen(true);
    void PlannerClient.startFocusSession(
      task
        ? { taskId: task.id, title: task.title, subjectId: task.subjectId }
        : { title: 'Focused Study Sprint', subjectId: 'math' }
    )
      .then((res) => {
        if (res?.sessionId) setActiveFocusSessionId(res.sessionId);
      })
      .catch(() => {});
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
      userId: user?.id || '',
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] rounded-3xl overflow-hidden border border-[#E3DFF5] dark:border-[#3D3861]">
      {/* Planner Header & Navigation Sub-tabs */}
      <PlannerHeader
        plan={activePlan}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAiWizard={() => setIsAiWizardOpen(true)}
        onOpenNewTask={handleOpenNewTask}
        onOpenFocusSession={() => {
          const nextTask = tasks.find((t) => t.status !== 'COMPLETED') || tasks[0] || null;
          handleStartFocusSession(nextTask);
        }}
        onOpenVersionHistory={() => setIsVersionModalOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <ScreenSkeleton rows={4} />
        ) : loadError ? (
          <EmptyState
            variant="error"
            title="Could not load study planner"
            description={loadError}
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => fetchPlannerData()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Retry
              </Button>
            }
          />
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
              <Suspense fallback={<ChartSkeleton label="Loading progress & analytics charts..." />}>
                <PlannerProgressView
                  analytics={analytics}
                  settings={settings}
                  recommendations={recommendations}
                  onApplyRecommendation={() => {
                    fetchPlannerData();
                  }}
                />
              </Suspense>
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
          setActiveFocusSessionId(null);
        }}
        onComplete={async (durationSeconds, notes, completed) => {
          if (activeFocusSessionId) {
            try {
              await PlannerClient.stopFocusSession(activeFocusSessionId, durationSeconds, Boolean(completed), notes);
            } catch (err) {
              console.error('Failed to persist focus session:', err);
            }
          }
          if (completed && durationSeconds >= 60) {
            const earned = Math.min(50, Math.floor((durationSeconds / 60) * 1.5));
            if (earned > 0) {
              awardXp(earned, `Focus study session: ${focusTask?.title || 'Deep Work'}`);
            }
          }
          await fetchPlannerData();
        }}
      />
    </div>
  );
};
