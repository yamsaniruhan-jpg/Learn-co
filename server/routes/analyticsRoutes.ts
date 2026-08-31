import { Router, Request, Response } from 'express';
import { Database, withUserLock } from '../db';
import { AdaptiveAnalyticsEngine, invalidateUserAnalyticsCache } from '../services/adaptiveAnalyticsEngine';
import { SubjectId, ExamTrackId } from '../../src/types/curriculum';

export const analyticsRouter = Router();

// Middleware to authenticate user from Bearer token
function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized. Authentication token required.' });
    return;
  }
  const token = authHeader.substring(7);
  const user = Database.getSessionUser(token);
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
    return;
  }
  (req as any).userId = user.id;
  next();
}

analyticsRouter.use(requireAuth);

/**
 * GET /api/analytics/dashboard
 * Retrieves complete aggregated learner analytics dashboard data
 */
analyticsRouter.get('/dashboard', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const dashboard = AdaptiveAnalyticsEngine.getDashboard(userId);
    res.json({ success: true, data: dashboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch analytics dashboard' });
  }
});

/**
 * GET /api/analytics/mastery
 * Retrieves concept masteries with optional filtering
 */
analyticsRouter.get('/mastery', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { subject, label, weakOnly } = req.query;

    let masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);

    if (subject && subject !== 'all') {
      masteries = masteries.filter((m) => m.subjectId === subject);
    }
    if (label && label !== 'all') {
      masteries = masteries.filter((m) => m.masteryLabel === label);
    }
    if (weakOnly === 'true') {
      masteries = masteries.filter((m) => m.isWeakArea);
    }

    res.json({ success: true, data: masteries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch concept masteries' });
  }
});

/**
 * GET /api/analytics/subject/:subjectId
 * Retrieves detailed topic breakdown for a subject
 */
analyticsRouter.get('/subject/:subjectId', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const subjectId = req.params.subjectId as SubjectId;
    const masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);
    const topics = AdaptiveAnalyticsEngine.calculateTopicDetails(userId, subjectId, masteries);

    res.json({ success: true, data: topics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch subject analytics' });
  }
});

/**
 * GET /api/analytics/exam-readiness
 * Retrieves exam readiness calculation for active or requested track
 */
analyticsRouter.get('/exam-readiness', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const track = req.query.track as ExamTrackId | undefined;
    const masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);
    const readiness = AdaptiveAnalyticsEngine.calculateExamReadiness(userId, masteries, track);

    res.json({ success: true, data: readiness });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to calculate exam readiness' });
  }
});

/**
 * GET /api/analytics/mistakes
 * Retrieves mistake analytics and list of mistakes for notebook
 */
analyticsRouter.get('/mistakes', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const subject = req.query.subject as string | undefined;
    const mistakes = Database.getMistakes(userId, subject);
    const summary = AdaptiveAnalyticsEngine.calculateMistakeAnalytics(userId);

    res.json({
      success: true,
      data: {
        summary,
        mistakes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch mistakes' });
  }
});

/**
 * POST /api/analytics/mistakes/:mistakeId/resolve
 * Toggles or sets resolved status of a mistake
 */
analyticsRouter.post('/mistakes/:mistakeId/resolve', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mistakeId = req.params.mistakeId;
  const { resolved } = req.body;

  try {
    const result = await withUserLock(userId, async () => {
      const mistakes = Database.getMistakes(userId);
      const target = mistakes.find((m) => m.id === mistakeId);
      if (!target) {
        throw new Error('Mistake not found.');
      }
      target.resolved = resolved !== undefined ? !!resolved : !target.resolved;
      invalidateUserAnalyticsCache(userId);
      return target;
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to update mistake' });
  }
});

/**
 * POST /api/analytics/mistakes/:mistakeId/schedule-task
 * Schedules a remediation review task directly into the Study Planner
 */
analyticsRouter.post('/mistakes/:mistakeId/schedule-task', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mistakeId = req.params.mistakeId;
  const { scheduledDate, scheduledTime } = req.body;

  try {
    const result = await withUserLock(userId, async () => {
      const mistakes = Database.getMistakes(userId);
      const target = mistakes.find((m) => m.id === mistakeId);
      if (!target) {
        throw new Error('Mistake not found.');
      }

      const dateStr = scheduledDate || new Date().toISOString().split('T')[0];
      const task = Database.createTask(userId, {
        title: `Remediate Mistake: ${target.topicId}`,
        description: `Review and retry question "${target.questionText.slice(0, 80)}..."`,
        subjectId: (target.subjectId || 'math') as SubjectId,
        topicId: target.topicId,
        taskType: 'REVIEW_MISTAKES',
        scheduledDate: dateStr,
        scheduledStartTime: scheduledTime || '17:00',
        estimatedDurationMinutes: 15,
        priority: 'HIGH',
      });

      invalidateUserAnalyticsCache(userId);
      return task;
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to schedule remediation task' });
  }
});

/**
 * GET /api/analytics/next-best-actions
 * Retrieves explainable next-best-actions recommendations
 */
analyticsRouter.get('/next-best-actions', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const masteries = AdaptiveAnalyticsEngine.calculateConceptMasteries(userId);
    const mistakes = Database.getMistakes(userId);
    const actions = AdaptiveAnalyticsEngine.generateNextBestActions(userId, masteries, mistakes);

    res.json({ success: true, data: actions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/analytics/trends
 * Retrieves time-series progress trends
 */
analyticsRouter.get('/trends', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const trends = AdaptiveAnalyticsEngine.calculateProgressTrends(userId);
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch progress trends' });
  }
});

/**
 * POST /api/analytics/ai-diagnostic-summary
 * Generates an AI-synthesized Socratic cognitive diagnostic summary
 */
analyticsRouter.post('/ai-diagnostic-summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { focus } = req.body;
    const summary = await AdaptiveAnalyticsEngine.generateAiDiagnosticSummary(userId, focus);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate diagnostic summary' });
  }
});
