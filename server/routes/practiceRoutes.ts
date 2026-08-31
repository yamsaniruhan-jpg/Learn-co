import { Router, Response } from 'express';
import { Database } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { XpEngine } from '../xpEngine';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import { invalidateUserAnalyticsCache } from '../services/adaptiveAnalyticsEngine';

const router = Router();

// GET /api/practice/quota
router.get('/quota', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const quota = XpEngine.getDailyQuota(userId);
    res.json({ quota });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch practice quota.' });
  }
});

// POST /api/practice/submit-attempt
router.post('/submit-attempt', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    let {
      attemptId,
      questionId,
      subjectId,
      topicId,
      subtopicId,
      conceptId,
      difficulty,
      questionText,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      explanation,
      stepByStepSolution,
      solvingTimeSeconds,
      timeSpentSeconds,
      hintsRevealedCount,
      hintsUsedCount,
    } = req.body;

    if (!attemptId) {
      attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Look up question in MASTER_QUESTION_BANK if some metadata is missing
    const bankQuestion = MASTER_QUESTION_BANK.find((q) => q.id === questionId);
    if (bankQuestion) {
      if (!subjectId) subjectId = bankQuestion.subjectId;
      if (!topicId) topicId = bankQuestion.topicId;
      if (!conceptId) conceptId = bankQuestion.conceptId;
      if (!difficulty) difficulty = bankQuestion.difficulty;
      if (!questionText) questionText = bankQuestion.questionText;
      if (correctAnswer === undefined) {
        correctAnswer = Array.isArray(bankQuestion.correctAnswer)
          ? bankQuestion.correctAnswer.join(', ')
          : bankQuestion.correctAnswer;
      }
      if (!explanation) explanation = bankQuestion.explanation;
      if (!stepByStepSolution) stepByStepSolution = bankQuestion.stepByStepSolution;
    }

    if (correctAnswer === undefined && isCorrect !== undefined) {
      correctAnswer = isCorrect ? selectedAnswer : 'Other';
    }

    const result = await XpEngine.submitAttempt(userId, {
      attemptId,
      questionId: questionId || `q-custom-${Date.now()}`,
      subjectId: subjectId || 'math',
      topicId: topicId || 'General Practice',
      subtopicId,
      conceptId,
      difficulty: difficulty || 'medium',
      questionText: questionText || '',
      selectedAnswer: selectedAnswer ?? '',
      correctAnswer: correctAnswer ?? '',
      explanation: explanation || '',
      stepByStepSolution,
      solvingTimeSeconds: solvingTimeSeconds || timeSpentSeconds || 0,
      hintsRevealedCount: hintsRevealedCount || hintsUsedCount || 0,
    });

    invalidateUserAnalyticsCache(userId);

    res.json({
      success: true,
      ...result,
      xpEarned: result.xpAwarded,
      dailyQuotaRemaining: result.dailyAllowanceRemaining,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.message || 'Failed to process question attempt.',
      code: err.code || 'ATTEMPT_ERROR',
    });
  }
});

// GET /api/practice/history
router.get('/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const attempts = Database.getUserAttempts(userId);
    res.json({ attempts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch attempt history.' });
  }
});

export default router;
