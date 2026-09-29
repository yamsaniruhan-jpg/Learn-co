import { AuthClient } from './authClient';
import {
  StudyPlan,
  StudyTask,
  StudyGoal,
  StudyScheduleSettings,
  PlannerAnalytics,
  ScheduleConflict,
  PlannerAdaptationRecommendation,
  PlanGenerationInput,
  PlanGenerationResult,
  StudyPlanVersion,
} from '../types/planner';

function getHeaders(): HeadersInit {
  const token = AuthClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export class PlannerClient {
  /**
   * Fetch complete planner overview state in a single optimized request
   */
  static async getOverview(): Promise<{
    plan: StudyPlan | null;
    tasks: StudyTask[];
    goals: StudyGoal[];
    settings: StudyScheduleSettings | null;
    analytics: PlannerAnalytics | null;
    conflicts: ScheduleConflict[];
    recommendations: PlannerAdaptationRecommendation[];
  }> {
    const res = await fetch('/api/planner/overview', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch planner overview.');
    return res.json();
  }

  /**
   * Fetch active study plan
   */
  static async getActivePlan(): Promise<{
    plan: StudyPlan | null;
    tasks: StudyTask[];
    goals: StudyGoal[];
    scheduleSettings?: StudyScheduleSettings;
  }> {
    const res = await fetch('/api/planner/active', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch active plan.');
    return res.json();
  }

  /**
   * Fetch tasks list
   */
  static async getTasks(): Promise<StudyTask[]> {
    const res = await fetch('/api/planner/tasks', { headers: getHeaders() });
    if (!res.ok) return [];
    const d = await res.json();
    return d.tasks || [];
  }

  /**
   * Create or update a study task
   */
  static async saveTask(taskData: Partial<StudyTask>): Promise<StudyTask> {
    const isEdit = Boolean(taskData.id);
    const url = isEdit ? `/api/planner/tasks/${taskData.id}` : '/api/planner/tasks';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });

    if (!res.ok) throw new Error('Failed to save study task.');
    const d = await res.json();
    return d.task;
  }

  /**
   * Toggle task completion status
   */
  static async updateTaskStatus(taskId: string, status: string): Promise<StudyTask> {
    const res = await fetch(`/api/planner/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        status,
        completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
      }),
    });

    if (!res.ok) throw new Error('Failed to update task status.');
    const d = await res.json();
    return d.task;
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string): Promise<void> {
    const res = await fetch(`/api/planner/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete task.');
  }

  /**
   * Reschedule a single task
   */
  static async rescheduleTask(
    taskId: string,
    newDate: string,
    newStartTime?: string,
    newEndTime?: string
  ): Promise<StudyTask> {
    const res = await fetch(`/api/planner/tasks/${taskId}/reschedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newDate, newStartTime, newEndTime }),
    });

    if (!res.ok) throw new Error('Failed to reschedule task.');
    const d = await res.json();
    return d.task;
  }

  /**
   * Batch reschedule all overdue/missed tasks forward to today or tomorrow
   */
  static async batchRescheduleMissed(targetDate?: string): Promise<{ rescheduledCount: number; tasks: StudyTask[] }> {
    const res = await fetch('/api/planner/reschedule-missed', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetDate }),
    });

    if (!res.ok) throw new Error('Failed to reschedule overdue tasks.');
    return res.json();
  }

  /**
   * Fetch goals list
   */
  static async getGoals(): Promise<StudyGoal[]> {
    const res = await fetch('/api/planner/goals', { headers: getHeaders() });
    if (!res.ok) return [];
    const d = await res.json();
    return d.goals || [];
  }

  /**
   * Create or update a goal
   */
  static async saveGoal(goalData: Partial<StudyGoal>): Promise<StudyGoal> {
    const isEdit = Boolean(goalData.id);
    const url = isEdit ? `/api/planner/goals/${goalData.id}` : '/api/planner/goals';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(goalData),
    });

    if (!res.ok) throw new Error('Failed to save study goal.');
    const d = await res.json();
    return d.goal;
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(goalId: string): Promise<void> {
    const res = await fetch(`/api/planner/goals/${goalId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete goal.');
  }

  /**
   * Fetch schedule settings
   */
  static async getSettings(): Promise<StudyScheduleSettings> {
    const res = await fetch('/api/planner/settings', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch planner settings.');
    const d = await res.json();
    return d.settings;
  }

  /**
   * Save schedule settings
   */
  static async saveSettings(settings: Partial<StudyScheduleSettings>): Promise<StudyScheduleSettings> {
    const res = await fetch('/api/planner/settings', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });

    if (!res.ok) throw new Error('Failed to save schedule settings.');
    const d = await res.json();
    return d.settings;
  }

  /**
   * Generate AI study plan preview
   */
  static async generateAiPlan(input: PlanGenerationInput): Promise<PlanGenerationResult> {
    const res = await fetch('/api/planner/generate-ai', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error('Failed to generate AI plan.');
    return res.json();
  }

  /**
   * Apply previewed AI plan to user profile
   */
  static async applyGeneratedPlan(result: PlanGenerationResult): Promise<{ plan: StudyPlan; tasksCount: number }> {
    const res = await fetch('/api/planner/apply-generated', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ generatedPlan: result }),
    });

    if (!res.ok) throw new Error('Failed to apply AI plan.');
    return res.json();
  }

  /**
   * Get plan version history
   */
  static async getVersions(planId: string): Promise<StudyPlanVersion[]> {
    const res = await fetch(`/api/planner/versions/${planId}`, { headers: getHeaders() });
    if (!res.ok) return [];
    const d = await res.json();
    return d.versions || [];
  }

  /**
   * Rollback plan to prior version
   */
  static async rollbackPlan(planId: string, versionId: string): Promise<{ plan: StudyPlan; tasks: StudyTask[] }> {
    const res = await fetch(`/api/planner/versions/${planId}/rollback/${versionId}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error('Failed to rollback plan version.');
    return res.json();
  }

  /**
   * Start focus session on task
   */
  static async startFocusSession(taskId: string): Promise<{ sessionId: string; task: StudyTask }> {
    const res = await fetch('/api/planner/sessions/start', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ taskId }),
    });

    if (!res.ok) throw new Error('Failed to start focus session.');
    return res.json();
  }

  /**
   * Stop focus session
   */
  static async stopFocusSession(
    sessionId: string,
    minutesSpent: number,
    notes?: string
  ): Promise<{ task: StudyTask }> {
    const res = await fetch('/api/planner/sessions/stop', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId, minutesSpent, notes }),
    });

    if (!res.ok) throw new Error('Failed to stop focus session.');
    return res.json();
  }
}
