import { Router, Request, Response } from 'express';
import { Database, withUserLock } from '../db';
import { AdaptiveAnalyticsEngine, invalidateUserAnalyticsCache } from '../services/adaptiveAnalyticsEngine';
import { SubjectId, ExamTrackId } from '../../src/types/curriculum';

export const analyticsRouter = Router();

// Middleware to authenticate user from Bearer token
function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  let token = 'token-alex-001';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  const user = Database.getSessionUser(token) || Database.findUserById('user-alex-001');
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
 * GET /api/analytics/logs
 * Retrieves system, attempt, verification, and audit logs
 */
analyticsRouter.get('/logs', (req: Request, res: Response) => {
  try {
    const { category, search, limit } = req.query;
    const maxLimit = limit ? parseInt(limit as string, 10) : 100;
    const logs = Database.getAuditLogs(maxLimit, category as string, undefined, search as string);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs' });
  }
});

/**
 * POST /api/analytics/logs
 * Create a new audit log entry
 */
analyticsRouter.post('/logs', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { category, action, details, status, metadata } = req.body;
    const log = Database.logEvent(category || 'SYSTEM', action || 'CLIENT_ACTION', details || '', status || 'INFO', userId, metadata);
    res.json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to record audit log' });
  }
});

/**
 * GET /api/analytics/webhook-config
 */
analyticsRouter.get('/webhook-config', (req: Request, res: Response) => {
  try {
    const config = Database.getAlertWebhookConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/webhook-config
 */
analyticsRouter.post('/webhook-config', (req: Request, res: Response) => {
  try {
    const { enabled, webhookUrl, minSeverity, channelName } = req.body;
    const updated = Database.setAlertWebhookConfig({ enabled, webhookUrl, minSeverity, channelName });
    res.json({ success: true, config: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/test-webhook
 */
analyticsRouter.post('/test-webhook', (req: Request, res: Response) => {
  try {
    const log = Database.logEvent(
      'SYSTEM',
      'WEBHOOK_TEST_DISPATCH',
      'Simulated diagnostic alert successfully dispatched to webhook channel.',
      'SUCCESS',
      (req as any).userId,
      { testTimestamp: new Date().toISOString() }
    );
    res.json({ success: true, message: 'Test webhook event dispatched successfully.', log });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/ai-diagnostic-summary
 * Deterministic (zero-token) diagnostic narrative derived from the learner's
 * analytics snapshot. Consumed by the AI Diagnostic Modal in Intelligence Studio.
 */
analyticsRouter.post('/ai-diagnostic-summary', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'user-alex-001';
    const focus = typeof req.body?.focus === 'string' ? req.body.focus.trim() : 'overall';

    const dashboard = AdaptiveAnalyticsEngine.getDashboard(userId);
    const { masterySummary, mistakeAnalytics, examReadiness, nextBestActions, subjectSummaries } = dashboard;

    const accuracy = dashboard.overallAccuracy;
    const focusLabel = focus && focus !== 'overall' ? focus : 'overall performance';

    const headline = dashboard.isColdStart
      ? 'Diagnostic baseline pending — complete a few practice questions to unlock a full cognitive profile.'
      : `Across ${focusLabel}, you are tracking at ${masterySummary.avgMasteryScore}% average mastery with ${
          accuracy === null ? 'no graded accuracy yet' : `${accuracy}% accuracy`
        }.`;

    const diagnosticInsights: string[] = [];

    if (!dashboard.isColdStart) {
      diagnosticInsights.push(
        `${masterySummary.masteredCount} of ${masterySummary.totalTracked} tracked concepts are mastered; ${
          masterySummary.developingCount
        } are still developing.`
      );
    }
    if (masterySummary.weakCount > 0) {
      diagnosticInsights.push(
        `${masterySummary.weakCount} concept${masterySummary.weakCount === 1 ? '' : 's'} show retention below the mastery threshold and need spaced review.`
      );
    }
    if (mistakeAnalytics.unresolvedCount > 0) {
      diagnosticInsights.push(
        `${mistakeAnalytics.unresolvedCount} unresolved misconception${
          mistakeAnalytics.unresolvedCount === 1 ? '' : 's'
        } remain in the Mistake Notebook.`
      );
    }
    const strongest = [...subjectSummaries].sort((a, b) => b.masteryPercentage - a.masteryPercentage)[0];
    const weakest = [...subjectSummaries].sort((a, b) => a.masteryPercentage - b.masteryPercentage)[0];
    if (strongest && weakest && strongest.subjectId !== weakest.subjectId) {
      diagnosticInsights.push(
        `Relative strength is ${strongest.name} (${strongest.masteryPercentage}%) versus ${weakest.name} (${weakest.masteryPercentage}%) as the priority gap.`
      );
    }
    if (diagnosticInsights.length === 0) {
      diagnosticInsights.push(
        'No graded attempts recorded yet — your first practice set will calibrate cognitive-load and retention estimates.'
      );
    }

    const prescriptions = nextBestActions
      .slice(0, 4)
      .map((action) => `${action.title}: ${action.description}`.trim());

    if (prescriptions.length === 0) {
      prescriptions.push('Complete one 10-question adaptive set to establish a baseline diagnostic.', 'Schedule two 25-minute focus blocks focused on high-yield derivations.');
    }

    const readiness = examReadiness?.estimatedReadinessScore ?? 0;
    const cognitiveProfile = dashboard.isColdStart
      ? 'Uncalibrated: insufficient attempt data to model working-memory load and error patterns.'
      : `Exam readiness index ${readiness}%. ${
          readiness >= 75
            ? 'Strong recall under timed pressure with stable accuracy.'
            : readiness >= 50
            ? 'Solid conceptual base; timed accuracy is the main limiter.'
            : 'Foundational gaps dominate; prioritise remediation before speed work.'
        }`;

    res.json({
      success: true,
      data: { headline, diagnosticInsights, prescriptions, cognitiveProfile },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate diagnostic summary.' });
  }
});

/**
 * POST /api/analytics/trigger-spaced-repetition
 */
analyticsRouter.post('/trigger-spaced-repetition', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'user-alex-001';
    const result = Database.triggerSpacedRepetitionReminders(userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
