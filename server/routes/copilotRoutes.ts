import { Router, Response } from 'express';
import { Database } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CopilotGateway } from '../services/copilotGateway';
import { CopilotToolRegistry } from '../services/copilotTools';
import { CopilotCacheEngine } from '../services/copilotCacheEngine';
import { XpEngine } from '../xpEngine';
import { DAILY_DOUBTS_LIMIT } from '../../src/types/auth';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import {
  CopilotPromptOptions,
} from '../../src/types/copilot';
import { adminDb } from '../services/firebaseAdmin';

const router = Router();

// GET /api/copilot/quota
router.get('/quota', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const quotas = Database.getUserDailyQuotas(userId);
    res.json({ success: true, quota: quotas.doubts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch doubt quota.' });
  }
});

// GET /api/copilot/cache-stats - Telemetry on AI cost savings & token efficiency (Admin only)
router.get('/cache-stats', requireAuth, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = CopilotCacheEngine.getStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch cache stats.' });
  }
});

// POST /api/copilot/cache-clear - Reset cache (Admin only)
router.post('/cache-clear', requireAuth, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  try {
    CopilotCacheEngine.clear();
    res.json({ success: true, message: 'Copilot AI response cache purged.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear cache.' });
  }
});

// -------------------------------------------------------------
// 1. CONVERSATIONS MANAGEMENT API
// -------------------------------------------------------------

// GET /api/copilot/conversations
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { search } = req.query;
    const conversations = Database.listCopilotConversations(userId, search as string);
    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list conversations.' });
  }
});

// POST /api/copilot/conversations
router.post('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, mode, learnerLevel, subjectId } = req.body;

    const conversation = Database.createCopilotConversation(userId, {
      title,
      mode: mode || 'socratic_hint',
      learnerLevel: learnerLevel || 'intermediate',
      subjectId,
    });

    res.status(201).json({ conversation });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create conversation.' });
  }
});

// GET /api/copilot/conversations/:id
router.get('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const convId = req.params.id;

    const result = Database.getCopilotConversation(userId, convId);
    if (!result) {
      res.status(404).json({ error: 'Conversation not found or access denied.' });
      return;
    }

    res.json({ conversation: result.conversation, messages: result.messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get conversation.' });
  }
});

// PATCH /api/copilot/conversations/:id
router.patch('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const convId = req.params.id;
    const { title, mode, learnerLevel, subjectId, pinned } = req.body;

    const updated = Database.updateCopilotConversation(userId, convId, {
      title,
      mode,
      learnerLevel,
      subjectId,
      pinned,
    });

    if (!updated) {
      res.status(404).json({ error: 'Conversation not found or access denied.' });
      return;
    }

    res.json({ conversation: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update conversation.' });
  }
});

// DELETE /api/copilot/conversations/:id
router.delete('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const convId = req.params.id;

    const deleted = Database.deleteCopilotConversation(userId, convId);
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found or access denied.' });
      return;
    }

    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete conversation.' });
  }
});

// POST /api/copilot/conversations/:id/clear
router.post('/conversations/:id/clear', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const convId = req.params.id;

    const cleared = Database.clearCopilotConversation(userId, convId);
    if (!cleared) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    res.json({ success: true, message: 'Conversation cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear conversation.' });
  }
});

// DELETE /api/copilot/conversations - Delete all conversations
router.delete('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    Database.deleteAllCopilotConversations(userId);
    res.json({ success: true, message: 'All conversation history deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete all conversations.' });
  }
});

// GET /api/copilot/history/export - Export all history
router.get('/history/export', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const exportData = Database.exportAllCopilotHistory(userId);
    res.json({ success: true, data: exportData });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to export history.' });
  }
});

// -------------------------------------------------------------
// 2. COPILOT GENERATION & CHAT API
// -------------------------------------------------------------

// POST /api/copilot/chat
router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const body = req.body as CopilotPromptOptions & { message?: string };
    const {
      conversationId,
      mode = 'socratic_hint',
      learnerLevel = 'intermediate',
      context,
      selectedModel,
    } = body;
    const rawPrompt = typeof body.prompt === 'string' ? body.prompt : typeof body.message === 'string' ? body.message : '';

    if (!rawPrompt.trim()) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const prompt = rawPrompt.trim();

    // Enforce daily doubts quota (DAILY_DOUBTS_LIMIT per day, refreshes at midnight)
    let quotaInfo;
    try {
      quotaInfo = Database.checkAndIncrementDoubtQuota(userId);
    } catch (quotaErr: any) {
      res.status(429).json({
        error: quotaErr.message || 'Daily doubts quota exceeded.',
        isLimitReached: true,
        limit: DAILY_DOUBTS_LIMIT,
        remaining: 0,
      });
      return;
    }

    // Ensure conversation exists or create one
    let targetConvId = conversationId;
    if (!targetConvId) {
      const newConv = Database.createCopilotConversation(userId, {
        title: prompt.slice(0, 45),
        mode,
        learnerLevel,
        subjectId: context?.subjectId,
      });
      targetConvId = newConv.id;
    }

    // Save user message to database
    const userMsg = Database.addCopilotMessage(userId, targetConvId, {
      role: 'user',
      content: prompt.trim(),
      mode,
    });

    // Generate AI/Pedagogical response with RAG and tools
    const genResult = await CopilotGateway.generate({
      userId,
      conversationId: targetConvId,
      prompt: prompt.trim(),
      mode,
      learnerLevel,
      context,
      selectedModel,
    });

    // Save assistant message to database
    const assistantMsg = Database.addCopilotMessage(userId, targetConvId, {
      role: 'assistant',
      content: genResult.reply,
      mode,
      modelUsed: genResult.modelUsed,
      citations: genResult.citations,
      toolCalls: genResult.toolCalls,
      artifact: genResult.artifact,
    });

    res.json({
      conversationId: targetConvId,
      userMessage: userMsg,
      message: assistantMsg,
      citations: genResult.citations,
      toolCalls: genResult.toolCalls,
      artifact: genResult.artifact,
      modelUsed: genResult.modelUsed,
      doubtQuota: quotaInfo,
    });
  } catch (err: any) {
    console.error('Error in /api/copilot/chat:', err);
    res.status(500).json({ error: err.message || 'Copilot generation failed.' });
  }
});

// POST /api/copilot/stream (Server-Sent Events streaming)
router.post('/stream', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      conversationId,
      prompt,
      mode = 'socratic_hint',
      learnerLevel = 'intermediate',
      context,
      selectedModel,
    } = req.body as CopilotPromptOptions;

    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    // Enforce daily doubts quota (DAILY_DOUBTS_LIMIT per day, refreshes at midnight)
    try {
      Database.checkAndIncrementDoubtQuota(userId);
    } catch (quotaErr: any) {
      res.status(429).json({
        error: quotaErr.message || 'Daily doubts quota exceeded.',
        isLimitReached: true,
        limit: DAILY_DOUBTS_LIMIT,
        remaining: 0,
      });
      return;
    }

    // Prepare SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let targetConvId = conversationId;
    if (!targetConvId) {
      const newConv = Database.createCopilotConversation(userId, {
        title: prompt.slice(0, 45),
        mode,
        learnerLevel,
        subjectId: context?.subjectId,
      });
      targetConvId = newConv.id;
    }

    // Save user message
    Database.addCopilotMessage(userId, targetConvId, {
      role: 'user',
      content: prompt.trim(),
      mode,
    });

    // Generate response
    const genResult = await CopilotGateway.generate({
      userId,
      conversationId: targetConvId,
      prompt: prompt.trim(),
      mode,
      learnerLevel,
      context,
      selectedModel,
    });

    // Stream tokens in chunked simulation if full string returned
    const text = genResult.reply;
    const chunkSize = 20;
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 15));
    }

    // Stream citations if present
    if (genResult.citations && genResult.citations.length > 0) {
      for (const cit of genResult.citations) {
        res.write(`data: ${JSON.stringify({ type: 'citation', citation: cit })}\n\n`);
      }
    }

    // Stream artifact if present
    if (genResult.artifact) {
      res.write(`data: ${JSON.stringify({ type: 'artifact', artifact: genResult.artifact })}\n\n`);
    }

    // Save assistant message to database
    const assistantMsg = Database.addCopilotMessage(userId, targetConvId, {
      role: 'assistant',
      content: genResult.reply,
      mode,
      modelUsed: genResult.modelUsed,
      citations: genResult.citations,
      toolCalls: genResult.toolCalls,
      artifact: genResult.artifact,
    });

    // Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        conversationId: targetConvId,
        messageId: assistantMsg.id,
        modelUsed: genResult.modelUsed,
      })}\n\n`
    );
    res.end();
  } catch (err: any) {
    console.error('Error in /api/copilot/stream:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Streaming failed.' })}\n\n`);
    res.end();
  }
});

// -------------------------------------------------------------
// 3. TOOLS EXECUTION & PRACTICE SUBMISSION
// -------------------------------------------------------------

// POST /api/copilot/tools/execute
router.post('/tools/execute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { toolName, toolInput } = req.body;

    if (!toolName) {
      res.status(400).json({ error: 'toolName is required.' });
      return;
    }

    const result = await CopilotToolRegistry.executeTool(userId, toolName, toolInput);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Tool execution failed.' });
  }
});

// POST /api/copilot/practice/submit
router.post('/practice/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      questionId = `q-gen-${Date.now()}`,
      subjectId = 'math',
      topic = 'STEM Practice',
      userAnswer,
      correctAnswer: providedCorrectAnswer,
      isCorrect: providedIsCorrect,
      timeSpentSeconds = 30,
    } = req.body;

    let resolvedCorrectAnswer = providedCorrectAnswer;
    if (resolvedCorrectAnswer === undefined && questionId) {
      const bankQuestion = MASTER_QUESTION_BANK.find((q) => q.id === questionId);
      if (bankQuestion) {
        resolvedCorrectAnswer = Array.isArray(bankQuestion.correctAnswer)
          ? bankQuestion.correctAnswer.join(', ')
          : bankQuestion.correctAnswer;
      }
    }
    if (resolvedCorrectAnswer === undefined && providedIsCorrect !== undefined && userAnswer !== undefined) {
      resolvedCorrectAnswer = providedIsCorrect ? userAnswer : '__INCORRECT__';
    }

    if (userAnswer === undefined || userAnswer === null || userAnswer === '' || !resolvedCorrectAnswer) {
      res.status(400).json({ error: 'userAnswer and correctAnswer are required.' });
      return;
    }

    const attemptResult = await XpEngine.submitAttempt(userId, {
      attemptId: `att-copilot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionId,
      subjectId,
      topicId: topic,
      difficulty: 'medium',
      questionText: `Practice Question: ${topic}`,
      selectedAnswer: userAnswer,
      correctAnswer: resolvedCorrectAnswer,
      explanation: 'Copilot verified derivation.',
      solvingTimeSeconds: timeSpentSeconds,
      hintsRevealedCount: 0,
    });

    res.json({
      isCorrect: attemptResult.isCorrect,
      xpEarned: attemptResult.xpAwarded,
      message: attemptResult.isCorrect
        ? 'Correct! +5 XP awarded to your streak ledger.'
        : 'Not quite. Review the step-by-step invariant derivation.',
      gamification: Database.getGamification(userId),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Practice submission failed.' });
  }
});

// POST /api/copilot/feedback
router.post('/feedback', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { interactionId, messageId, rating } = req.body;

    if (adminDb) {
      try {
        await adminDb
          .collection('users').doc(userId)
          .collection('copilotHistory').doc(interactionId || messageId || 'feedback')
          .set({ feedback: rating, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err: any) {
        console.warn('Firestore feedback write skipped:', err?.message);
      }
    }

    res.json({ success: true, feedback: rating });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save feedback.' });
  }
});

// GET /api/copilot/history
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    let history: any[] = [];

    if (adminDb) {
      try {
        const snap = await adminDb
          .collection('users').doc(userId)
          .collection('copilotHistory')
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get();

        history = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      } catch (err: any) {
        console.warn('Firestore history read skipped:', err?.message);
      }
    }

    if (!history.length) {
      const convs = Database.listCopilotConversations(userId);
      history = convs.map((c) => ({
        id: c.id,
        role: 'assistant',
        title: c.title,
        mode: c.mode,
        timestamp: c.updatedAt,
      }));
    }

    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch history.' });
  }
});

export default router;
