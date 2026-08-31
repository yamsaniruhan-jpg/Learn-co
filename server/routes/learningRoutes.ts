import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Database } from '../db';
import { XpEngine } from '../xpEngine';
import { QuestionSelectionEngine } from '../services/questionSelectionEngine';
import { CURRICULUM_DATA, EXAM_TRACKS } from '../../src/data/curriculumData';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import { PracticeSessionConfig, QuestionBankItem } from '../../src/types/curriculum';
import { GoogleGenAI } from '@google/genai';

const router = Router();

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
router.post('/session/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const config: PracticeSessionConfig = req.body.config || {
      questionCount: 5,
      difficultyMode: 'calibrated_ladder',
      timed: false,
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

// GET /api/learning/questions
router.get('/questions', (req, res: Response) => {
  try {
    const { subjectId, difficulty, questionType, search, limit = 20, page = 1 } = req.query;

    let pool = [...MASTER_QUESTION_BANK];

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

    if (resource.resourceType !== 'quiz' || !resource.content.quiz) {
      res.status(400).json({ error: 'Resource is not a quiz or has no questions.' });
      return;
    }

    const convertedQuestions: QuestionBankItem[] = resource.content.quiz.map(
      (qItem: any, idx: number) => {
        const correctOption =
          qItem.options && qItem.correctIndex !== undefined
            ? qItem.options[qItem.correctIndex] || qItem.options[0]
            : 'A';

        return {
          id: `q-creator-${resource.id}-${idx}`,
          subjectId: resource.subjectId || 'math',
          examTracks: ['all'],
          chapterId: 'creator-synthesized-ch',
          topicId: resource.title,
          conceptId: `concept-creator-${resource.id}`,
          difficulty: resource.difficulty || 'medium',
          questionType: 'single_choice',
          questionText: qItem.question,
          options: qItem.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: correctOption,
          explanation: qItem.explanation || 'Solution synthesized from uploaded notes.',
          stepByStepSolution: [qItem.explanation || 'Direct application of definition.'],
          hints: ['Think about the core principle highlighted in your notes.'],
          tags: resource.tags || ['creator-import'],
          source: `Creator Studio: ${resource.title}`,
          verificationStatus: 'creator_imported',
          version: 1,
        };
      }
    );

    // Append to temporary master bank in memory
    for (const cq of convertedQuestions) {
      if (!MASTER_QUESTION_BANK.find((existing) => existing.id === cq.id)) {
        MASTER_QUESTION_BANK.push(cq);
      }
    }

    res.json({
      success: true,
      importedCount: convertedQuestions.length,
      questions: convertedQuestions,
      message: `Successfully imported ${convertedQuestions.length} questions into your practice question bank!`,
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

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
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

export default router;
