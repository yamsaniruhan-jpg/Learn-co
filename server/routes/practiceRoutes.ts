import { Router, Response } from 'express';
import { Database } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { XpEngine } from '../xpEngine';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import { invalidateUserAnalyticsCache } from '../services/adaptiveAnalyticsEngine';
import { isValidSubmittedAnswer } from '../../src/utils/gradeAnswer';
import { resolveParameterizedQuestionById } from '../services/parameterizedQuestionGenerator';
import { getSolvedQuestionIdsFromSql } from '../../src/db/persistence';

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

    // Reject incomplete submissions. Previously an empty body was accepted and
    // persisted an attempt with `questionId: undefined`, silently corrupting
    // mastery, accuracy and exam-readiness calculations.
    const invalidFields: string[] = [];
    if (!questionId || typeof questionId !== 'string') invalidFields.push('questionId');
    if (!subjectId || typeof subjectId !== 'string') invalidFields.push('subjectId');
    if (typeof isCorrect !== 'boolean') invalidFields.push('isCorrect');
    if (!isValidSubmittedAnswer(selectedAnswer)) invalidFields.push('selectedAnswer');
    if (correctAnswer !== undefined && !isValidSubmittedAnswer(correctAnswer)) invalidFields.push('correctAnswer');

    if (invalidFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Invalid attempt payload. Missing or invalid: ${invalidFields.join(', ')}.`,
        code: 'INVALID_ATTEMPT',
      });
      return;
    }

    if (attemptId !== undefined && (typeof attemptId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(attemptId) || ['__proto__', 'constructor', 'prototype'].includes(attemptId))) {
      res.status(400).json({ error: 'Invalid attempt ID.', code: 'INVALID_ATTEMPT_ID' });
      return;
    }
    if (!attemptId) {
      attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // A bank or server-parameterized question must always be graded and recorded using
    // server-owned metadata. A caller-supplied answer key must never override the bank.
    const bankQuestion =
      MASTER_QUESTION_BANK.find((q) => q.id === questionId) ||
      resolveParameterizedQuestionById(questionId);
    if (bankQuestion) {
      subjectId = bankQuestion.subjectId;
      topicId = bankQuestion.topicId;
      conceptId = bankQuestion.conceptId;
      difficulty = bankQuestion.difficulty;
      questionText = bankQuestion.questionText;
      correctAnswer = Array.isArray(bankQuestion.correctAnswer)
        ? bankQuestion.correctAnswer.join(', ')
        : bankQuestion.correctAnswer;
      explanation = bankQuestion.explanation;
      stepByStepSolution = bankQuestion.stepByStepSolution;
    }

    // For unverified questions with no answer key, retain the client's
    // self-check result explicitly rather than inventing a conflicting key.
    const unverifiedCorrect = !bankQuestion && correctAnswer === undefined ? isCorrect : undefined;
    if (correctAnswer === undefined) correctAnswer = 'Answer key unavailable (self-check)';
    if (Array.isArray(correctAnswer)) correctAnswer = correctAnswer.join(', ');

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
      unverifiedCorrect,
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

// GET /api/practice/solved-ids
router.get('/solved-ids', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const memoryIds = Database.getUserAttempts(userId).map((a) => a.questionId);
    const sqlIds = await getSolvedQuestionIdsFromSql(userId);
    const solvedIds = Array.from(new Set([...memoryIds, ...sqlIds].filter(Boolean)));
    res.json({
      success: true,
      solvedIds,
      solvedCount: solvedIds.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch solved question IDs.' });
  }
});

export default router;
