import { Router, Response } from 'express';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Database } from '../db';
import { XpEngine } from '../xpEngine';
import { QuestionSelectionEngine } from '../services/questionSelectionEngine';
import { CURRICULUM_DATA, EXAM_TRACKS } from '../../src/data/curriculumData';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import { convertCreatorQuiz } from '../services/creatorQuizConversion';
import { PracticeSessionConfig, QuestionBankItem } from '../../src/types/curriculum';
import { GoogleGenAI } from '@google/genai';
// Legacy CommonJS service (its folder is marked "type": "commonjs").
import progressService from '../../services/progressService';
import { adminDb } from '../services/firebaseAdmin';
import { getSolvedQuestionIdsFromSql } from '../../src/db/persistence';
import {
  OlympiadDiscipline,
  resolveParameterizedQuestionById,
} from '../services/parameterizedQuestionGenerator';
import { gradeQuestionAnswer, isValidSubmittedAnswer } from '../../src/utils/gradeAnswer';
import { invalidateUserAnalyticsCache } from '../services/adaptiveAnalyticsEngine';

const router = Router();
const userImportedQuestions = new Map<string, QuestionBankItem[]>();

// Lazy Gemini AI initialization with resilience cascade
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// GET /api/learning/curriculum
router.get('/curriculum', (req, res: Response) => {
  try {
    const { subjectId, trackId } = req.query;

    let data = [...CURRICULUM_DATA];

    if (subjectId && subjectId !== 'all') {
      data = data.filter((s) => s.id === subjectId);
    }

    if (trackId && trackId !== 'all') {
      data = data.map((subject) => ({
        ...subject,
        chapters: subject.chapters.filter(
          (ch) => ch.examTracks.includes(trackId as any) || ch.examTracks.includes('all')
        ),
      }));
    }

    res.json({
      success: true,
      subjects: data,
      tracks: EXAM_TRACKS,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch curriculum.' });
  }
});

// GET /api/learning/tracks
router.get('/tracks', (req, res: Response) => {
  try {
    res.json({
      success: true,
      tracks: EXAM_TRACKS,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch exam tracks.' });
  }
});

// GET /api/learning/concept/:conceptId
router.get('/concept/:conceptId', (req, res: Response) => {
  try {
    const { conceptId } = req.params;

    for (const subject of CURRICULUM_DATA) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          for (const subtopic of topic.subtopics) {
            const concept = subtopic.concepts.find((c) => c.id === conceptId);
            if (concept) {
              res.json({
                success: true,
                concept,
                chapterTitle: chapter.title,
                topicTitle: topic.title,
                subjectName: subject.name,
              });
              return;
            }
          }
        }
      }
    }

    res.status(404).json({ error: 'Concept not found.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch concept.' });
  }
});

// POST /api/learning/session/start
router.post('/session/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const rawConfig = req.body.config || {
      questionCount: 5,
      difficultyMode: 'calibrated_ladder',
      timed: false,
    };
    const sqlSolvedIds = await getSolvedQuestionIdsFromSql(userId);
    const clientExcluded = Array.isArray(rawConfig.excludeQuestionIds)
      ? rawConfig.excludeQuestionIds
          .filter((id: unknown): id is string => typeof id === 'string')
          .slice(0, 20000)
      : [];
    const config: PracticeSessionConfig = {
      ...rawConfig,
      excludeQuestionIds: Array.from(new Set([...clientExcluded, ...sqlSolvedIds])).slice(0, 25000),
    };

    // Check user daily quota before starting
    const quota = XpEngine.getDailyQuota(userId);
    if (quota.isLimitReached) {
      res.status(429).json({
        error: 'Daily practice limit (25 questions) has been reached for today.',
        code: 'DAILY_LIMIT_REACHED',
        quota,
      });
      return;
    }

    // Select questions using QuestionSelectionEngine
    const questions = QuestionSelectionEngine.selectPracticeSession(userId, config);

    res.json({
      success: true,
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      config,
      questions,
      quota,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate practice session.' });
  }
});

// ============================================
// TIMED OLYMPIAD MOCK CONTEST ENDPOINTS
// ============================================
const activeContests = new Map<string, {
  contestId: string;
  userId: string;
  track: OlympiadDiscipline;
  title: string;
  durationSeconds: number;
  questionIds: string[];
  startedAt: string;
}>();

const CONTEST_TITLES: Record<OlympiadDiscipline, string> = {
  ipho: 'IPhO Physics Olympiad Mock Contest',
  icho: 'IChO Chemistry Olympiad Mock Contest',
  ibho: 'IBHO / IBO Biology Olympiad Mock Contest',
  ijso: 'IJSO Junior Science Olympiad Mock Contest',
  ict: 'ICT International Coding & Informatics Mock Contest',
  mixed: 'All-Olympiad Multi-Discipline Mock Contest',
};

// POST /api/learning/contest/start
router.post('/contest/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const rawTrack = String(req.body?.track || 'mixed').toLowerCase() as OlympiadDiscipline;
    const track: OlympiadDiscipline = ['ipho', 'icho', 'ibho', 'ijso', 'ict', 'mixed'].includes(rawTrack)
      ? rawTrack
      : 'mixed';
    const rawCount = Number(req.body?.questionCount || 10);
    const questionCount = Math.min(25, Math.max(5, Number.isFinite(rawCount) ? Math.round(rawCount) : 10));
    const rawDurationMin = Number(req.body?.durationMinutes || 30);
    const durationSeconds = Math.min(180 * 60, Math.max(10 * 60, Math.round(rawDurationMin * 60)));

    const sqlSolvedIds = await getSolvedQuestionIdsFromSql(userId);
    const clientExcluded = Array.isArray(req.body?.excludeQuestionIds)
      ? req.body.excludeQuestionIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];

    const selected = QuestionSelectionEngine.selectOlympiadContest(
      userId,
      track,
      questionCount,
      Array.from(new Set([...sqlSolvedIds, ...clientExcluded]))
    );

    const contestId = `contest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const title = CONTEST_TITLES[track];
    activeContests.set(contestId, {
      contestId,
      userId,
      track,
      title,
      durationSeconds,
      questionIds: selected.map((q) => q.id),
      startedAt: new Date().toISOString(),
    });
    if (activeContests.size > 500) {
      const oldest = activeContests.keys().next().value;
      if (oldest) activeContests.delete(oldest);
    }

    // Delayed grading: strip answer keys and step-by-step solutions until contest submission
    const sanitizedQuestions = selected.map(({ correctAnswer: _ca, explanation: _ex, stepByStepSolution: _st, ...rest }) => ({
      ...rest,
    }));

    res.json({
      success: true,
      contestId,
      track,
      title,
      durationSeconds,
      questions: sanitizedQuestions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to launch Olympiad contest.' });
  }
});

// POST /api/learning/contest/submit
router.post('/contest/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { contestId, track = 'mixed', questionIds, answers = {}, timeSpentSeconds = 0 } = req.body || {};
    const record = typeof contestId === 'string' ? activeContests.get(contestId) : undefined;
    if (record && record.userId !== userId) {
      res.status(403).json({ error: 'Contest belongs to a different account.' });
      return;
    }

    const orderedIds: string[] = record?.questionIds || (Array.isArray(questionIds) ? questionIds.filter((id: unknown): id is string => typeof id === 'string') : []);
    if (orderedIds.length === 0) {
      res.status(400).json({ error: 'No contest questions provided.' });
      return;
    }

    let correctCount = 0;
    let totalXpEarned = 0;
    const perQuestionReviews: any[] = [];
    const safeTotalTime = Math.max(orderedIds.length, Number(timeSpentSeconds) || 0);
    const avgTime = Math.max(5, Math.round(safeTotalTime / orderedIds.length));

    for (let idx = 0; idx < orderedIds.length; idx++) {
      const qId = orderedIds[idx];
      const bankQ =
        MASTER_QUESTION_BANK.find((q) => q.id === qId) ||
        resolveParameterizedQuestionById(qId);
      if (!bankQ) continue;

      const rawUserAnswer = answers && typeof answers === 'object' ? (answers as Record<string, any>)[qId] : undefined;
      const hasAnswer = isValidSubmittedAnswer(rawUserAnswer);
      const isCorrect = hasAnswer ? gradeQuestionAnswer(bankQ, rawUserAnswer) : false;
      if (isCorrect) correctCount++;

      let xpAwarded = 0;
      if (hasAnswer) {
        try {
          const attemptRes = await XpEngine.submitAttempt(userId, {
            attemptId: `cnt-${contestId || 'ad'}-${idx}-${qId.slice(0, 20)}`,
            questionId: bankQ.id,
            subjectId: bankQ.subjectId,
            topicId: bankQ.topicId,
            subtopicId: bankQ.subtopicId,
            conceptId: bankQ.conceptId,
            difficulty: bankQ.difficulty,
            questionText: bankQ.questionText,
            selectedAnswer: rawUserAnswer,
            correctAnswer: Array.isArray(bankQ.correctAnswer)
              ? bankQ.correctAnswer.join(', ')
              : bankQ.correctAnswer,
            explanation: bankQ.explanation,
            stepByStepSolution: bankQ.stepByStepSolution,
            solvingTimeSeconds: avgTime,
            hintsRevealedCount: 0,
          });
          xpAwarded = attemptRes.xpAwarded;
          totalXpEarned += xpAwarded;
        } catch {
          // If daily practice quota is reached mid-contest, preserve authoritative grading without losing contest results
        }
      }

      perQuestionReviews.push({
        question: bankQ,
        userAnswer: hasAnswer ? rawUserAnswer : null,
        isCorrect,
        xpAwarded,
        timeSpent: avgTime,
      });
    }

    invalidateUserAnalyticsCache(userId);
    if (record) activeContests.delete(record.contestId);

    const totalQuestions = perQuestionReviews.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const medalTier =
      accuracy >= 85 ? 'Gold Medal Standing'
      : accuracy >= 70 ? 'Silver Medal Standing'
      : accuracy >= 50 ? 'Bronze Medal Standing'
      : 'Honorable Participant';

    const gamification = Database.getGamification(userId);
    const quota = XpEngine.getDailyQuota(userId);

    res.json({
      success: true,
      contestId: contestId || null,
      track: record?.track || track,
      title: record?.title || CONTEST_TITLES[(track as OlympiadDiscipline) || 'mixed'],
      totalQuestions,
      correctCount,
      accuracy,
      medalTier,
      totalXpEarned,
      timeSpentSeconds: safeTotalTime,
      reviews: perQuestionReviews,
      gamification,
      quota,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to grade Olympiad contest.' });
  }
});

// GET /api/learning/questions
router.get('/questions', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subjectId, difficulty, questionType, search, limit = 20, page = 1 } = req.query;

    const userCustom = req.userId ? (userImportedQuestions.get(req.userId) || []) : [];
    let pool = [...userCustom, ...MASTER_QUESTION_BANK];

    if (subjectId && subjectId !== 'all') {
      pool = pool.filter((q) => q.subjectId === subjectId);
    }
    if (difficulty && difficulty !== 'all') {
      pool = pool.filter((q) => q.difficulty === difficulty);
    }
    if (questionType && questionType !== 'all') {
      pool = pool.filter((q) => q.questionType === questionType);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      pool = pool.filter(
        (item) =>
          item.questionText.toLowerCase().includes(q) ||
          item.topicId.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = pool.length;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;
    const paginated = pool.slice(offset, offset + limitNum);

    res.json({
      success: true,
      questions: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch question bank.' });
  }
});

// GET /api/learning/weak-topics
router.get('/weak-topics', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const weakTopics = QuestionSelectionEngine.getWeakTopics(userId);
    res.json({ success: true, weakTopics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch weak topics.' });
  }
});

// GET /api/learning/recommendations
router.get('/recommendations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const recommendations = QuestionSelectionEngine.getRecommendations(userId);
    res.json({ success: true, recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch recommendations.' });
  }
});

// POST /api/learning/import-creator-quiz
router.post('/import-creator-quiz', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { resourceId } = req.body;

    if (!resourceId) {
      res.status(400).json({ error: 'resourceId is required.' });
      return;
    }

    const resource = Database.getResource(userId, resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Creator resource not found.' });
      return;
    }

    let convertedQuestions: QuestionBankItem[];
    try {
      convertedQuestions = convertCreatorQuiz(resource);
    } catch (error: any) {
      res.status(422).json({ error: error.message });
      return;
    }

    // Store imported quiz questions scoped to the authenticated user
    // Replace the previous snapshot for this resource, including removed items.
    const prefix = `creator-${resource.id}-`;
    const existing = (userImportedQuestions.get(userId) || []).filter(item => !item.id.startsWith(prefix));
    userImportedQuestions.set(userId, [...existing, ...convertedQuestions]);

    res.json({
      success: true,
      importedCount: convertedQuestions.length,
      questions: convertedQuestions,
      message: `Imported ${convertedQuestions.length} unverified questions into your temporary private question list; they do not earn server XP.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import creator quiz.' });
  }
});

// POST /api/learning/socratic-hint
router.post('/socratic-hint', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { questionText, topic, currentHintCount = 0 } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        hint: `Focus on the foundational invariant: review how the derivative or conservation law behaves under small variations. (Hint #${currentHintCount + 1})`,
      });
      return;
    }

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
    let hint = '';

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are the Socratic Tutor for Learn.co STEM platform.
A student is currently solving this question: "${questionText}" in topic "${topic}".
They requested Hint #${currentHintCount + 1}.
Provide a concise (1-2 sentences) Socratic hint that guides their first-principles intuition WITHOUT revealing the final answer or option choice.`,
                },
              ],
            },
          ],
          config: {
            maxOutputTokens: 250,
            temperature: 0.3,
          },
        });

        hint = response.text?.trim() || '';
        if (hint) break;
      } catch (e) {
        // Try next fallback model
      }
    }

    if (!hint) {
      hint = `Recall the fundamental theorem governing ${topic || 'this topic'}: check your boundary conditions and sign changes.`;
    }

    res.json({ success: true, hint });
  } catch (err: any) {
    res.json({
      success: true,
      hint: 'Recall the fundamental invariant governing this problem: check your boundary conditions and sign changes.',
    });
  }
});

// ============================================
// PROGRESS & SPACED REPETITION ENDPOINTS
// ============================================

// POST /api/learning/progress/:courseId/lesson/:lessonId
router.post('/progress/:courseId/lesson/:lessonId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const uid = req.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required.' });
    await progressService.updateProgress(uid, courseId, lessonId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update progress.' });
  }
});

// GET /api/learning/progress
router.get('/progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required.' });
    let progress: any[] = [];
    try {
      if (!adminDb) throw new Error('Firestore is not configured; using local store only.');
      const snap = await adminDb.collection('users').doc(uid).collection('progress').get();
      progress = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (err: any) {
      // Firestore is optional: the local JSON store remains authoritative.
      console.warn('Firestore progress query fallback:', err?.message);
    }
    res.json({ progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch progress.' });
  }
});

// GET /api/learning/review-cards
router.get('/review-cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required.' });
    const cards = await progressService.getDueCards(uid);
    res.json({ cards });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch review cards.' });
  }
});

// POST /api/learning/review-cards/:cardId
router.post('/review-cards/:cardId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required.' });
    await progressService.reviewCard(uid, req.params.cardId, req.body.quality);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save review.' });
  }
});

// GET /api/learning/weaknesses
router.get('/weaknesses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required.' });
    const analysis = await progressService.analyzeWeaknesses(uid);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze.' });
  }
});

export default router;
