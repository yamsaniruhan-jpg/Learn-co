import { Router, Request, Response } from 'express';
import { Database, withUserLock } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { PlannerEngine } from '../services/plannerEngine';
import { PlanGenerationInput, StudyPlan, StudyTask, StudyGoal } from '../../src/types/planner';

const router = Router();

// Ensure all planner routes require an authenticated user
router.use(requireAuth);

function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const sessionUser = Database.getSessionUser(token);
    if (sessionUser) return sessionUser.id;
  }
  return '';
}

// -------------------------------------------------------------
// 1. OVERVIEW & COMPLETE PLANNER STATE
// -------------------------------------------------------------

// GET /api/planner/overview
router.get('/overview', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const activeData = Database.getActivePlan(userId);
    const analytics = Database.getPlannerAnalytics(userId);
    const conflicts = Database.detectScheduleConflicts(userId);
    const recommendations = Database.getPlannerAdaptRecommendations(userId);

    res.json({
      plan: activeData.plan,
      tasks: activeData.tasks,
      goals: activeData.goals,
      settings: activeData.scheduleSettings,
      analytics,
      conflicts,
      recommendations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch planner overview.' });
  }
});

// -------------------------------------------------------------
// 2. PLAN CREATION, AI GENERATION & VERSION CONTROL
// -------------------------------------------------------------

// GET /api/planner/plan
router.get('/plan', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const activeData = Database.getActivePlan(userId);
    res.json(activeData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plan.' });
  }
});

// POST /api/planner/plan (Manual plan creation)
router.post('/plan', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { plan, tasks, goal } = req.body;

    const result = await withUserLock(userId, async () => {
      let createdGoal: StudyGoal | null = null;
      if (goal) {
        createdGoal = Database.createGoal(userId, goal);
      }

      const planData = {
        ...plan,
        goalIds: createdGoal ? [createdGoal.id, ...(plan.goalIds || [])] : plan.goalIds,
      };

      return Database.createPlan(userId, planData, tasks);
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create plan.' });
  }
});

// POST /api/planner/generate-ai (Preview AI-assisted plan)
router.post('/generate-ai', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const input: PlanGenerationInput = req.body;

    const preview = await PlannerEngine.generateAiPlan(userId, input);
    res.json(preview);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI plan.' });
  }
});

// POST /api/planner/apply-generated (Commit generated plan)
router.post('/apply-generated', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { plan, tasks, goal } = req.body;

    const result = await withUserLock(userId, async () => {
      let createdGoal: StudyGoal | null = null;
      if (goal) {
        createdGoal = Database.createGoal(userId, goal);
      }

      const planData = {
        ...plan,
        goalIds: createdGoal ? [createdGoal.id] : plan.goalIds || [],
      };

      return Database.createPlan(userId, planData, tasks);
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to apply generated plan.' });
  }
});

// GET /api/planner/versions/:planId
router.get('/versions/:planId', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { planId } = req.params;
    const versions = Database.getPlanVersions(userId, planId);
    res.json({ versions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get plan versions.' });
  }
});

// POST /api/planner/versions/:planId/rollback/:versionId
router.post('/versions/:planId/rollback/:versionId', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { planId, versionId } = req.params;

    const result = await withUserLock(userId, async () => {
      return Database.rollbackPlanVersion(userId, planId, versionId);
    });

    if (!result) {
      res.status(404).json({ error: 'Version not found or rollback failed.' });
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to rollback version.' });
  }
});

// -------------------------------------------------------------
// 3. GOALS MANAGEMENT
// -------------------------------------------------------------

// GET /api/planner/goals
router.get('/goals', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const goals = Database.listGoals(userId);
    res.json({ goals });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list goals.' });
  }
});

// POST /api/planner/goals
router.post('/goals', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const goalData = req.body;

    const goal = await withUserLock(userId, async () => {
      return Database.createGoal(userId, goalData);
    });

    res.status(201).json({ goal });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create goal.' });
  }
});

// PATCH /api/planner/goals/:id
router.patch('/goals/:id', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;
    const updates = req.body;

    const goal = await withUserLock(userId, async () => {
      return Database.updateGoal(userId, id, updates);
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found.' });
      return;
    }

    res.json({ goal });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update goal.' });
  }
});

// DELETE /api/planner/goals/:id
router.delete('/goals/:id', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;

    const success = await withUserLock(userId, async () => {
      return Database.deleteGoal(userId, id);
    });

    if (!success) {
      res.status(404).json({ error: 'Goal not found.' });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete goal.' });
  }
});

// -------------------------------------------------------------
// 4. TASKS MANAGEMENT & RESCHEDULING
// -------------------------------------------------------------

// GET /api/planner/tasks
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { date, startDate, endDate, subjectId, status, goalId, planId } = req.query;

    const tasks = Database.listTasks(userId, {
      date: date as string,
      startDate: startDate as string,
      endDate: endDate as string,
      subjectId: subjectId as string,
      status: status as string,
      goalId: goalId as string,
      planId: planId as string,
    });

    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list tasks.' });
  }
});

// POST /api/planner/tasks
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const taskData = req.body;

    const task = await withUserLock(userId, async () => {
      return Database.createTask(userId, taskData);
    });

    res.status(201).json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create task.' });
  }
});

// PATCH /api/planner/tasks/:id
router.patch('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;
    const updates = req.body;

    const task = await withUserLock(userId, async () => {
      return Database.updateTask(userId, id, updates);
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update task.' });
  }
});

// DELETE /api/planner/tasks/:id
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;

    const success = await withUserLock(userId, async () => {
      return Database.deleteTask(userId, id);
    });

    if (!success) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete task.' });
  }
});

// POST /api/planner/tasks/:id/reschedule
router.post('/tasks/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;
    const { newDate, newStartTime, newEndTime } = req.body;

    if (!newDate) {
      res.status(400).json({ error: 'newDate is required.' });
      return;
    }

    const task = await withUserLock(userId, async () => {
      return Database.rescheduleTask(userId, id, newDate, newStartTime, newEndTime);
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reschedule task.' });
  }
});

// POST /api/planner/tasks/batch-reschedule-missed
router.post('/tasks/batch-reschedule-missed', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { targetDate } = req.body;

    const result = await withUserLock(userId, async () => {
      return Database.batchRescheduleMissedTasks(userId, targetDate);
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to batch reschedule missed tasks.' });
  }
});

// -------------------------------------------------------------
// 5. SCHEDULE SETTINGS, ANALYTICS & CONFLICTS
// -------------------------------------------------------------

// GET /api/planner/settings
router.get('/settings', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const settings = Database.getScheduleSettings(userId);
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get settings.' });
  }
});

// PUT /api/planner/settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const updates = req.body;

    const settings = await withUserLock(userId, async () => {
      return Database.updateScheduleSettings(userId, updates);
    });

    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings.' });
  }
});

// GET /api/planner/analytics
router.get('/analytics', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const analytics = Database.getPlannerAnalytics(userId);
    res.json({ analytics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get analytics.' });
  }
});

// GET /api/planner/conflicts
router.get('/conflicts', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const conflicts = Database.detectScheduleConflicts(userId);
    res.json({ conflicts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to detect conflicts.' });
  }
});

// GET /api/planner/recommendations
router.get('/recommendations', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const recommendations = Database.getPlannerAdaptRecommendations(userId);
    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get recommendations.' });
  }
});

// -------------------------------------------------------------
// 6. FOCUS STUDY SESSIONS (Interactive Study Session Mode)
// -------------------------------------------------------------

// POST /api/planner/sessions/start
router.post('/sessions/start', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { taskId, title, subjectId, topicTitle } = req.body;

    const session = await withUserLock(userId, async () => {
      return Database.startActiveStudySession(userId, {
        taskId,
        title: title || 'Focused Study Session',
        subjectId: subjectId || 'math',
        topicTitle,
      });
    });

    res.status(201).json({ session });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start study session.' });
  }
});

// POST /api/planner/sessions/stop
router.post('/sessions/stop', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { sessionId, durationSeconds, completed, notes } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required.' });
      return;
    }

    const session = await withUserLock(userId, async () => {
      return Database.stopActiveStudySession(
        userId,
        sessionId,
        durationSeconds || 0,
        !!completed,
        notes
      );
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    res.json({ session });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to stop study session.' });
  }
});

export default router;
