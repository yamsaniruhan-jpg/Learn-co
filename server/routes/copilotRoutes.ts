import { Router, Response, Request } from 'express';
import { Database, withUserLock } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CopilotGateway } from '../services/copilotGateway';
import { CopilotToolRegistry } from '../services/copilotTools';
import { RagEngine } from '../services/ragEngine';
import { XpEngine } from '../xpEngine';
import {
  CopilotMode,
  LearnerLevel,
  CopilotContextPayload,
  CopilotPromptOptions,
} from '../../src/types/copilot';

const router = Router();

// Middleware to resolve user ID (from token or fallback to demo user for seamless access)
function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const sessionUser = Database.getSessionUser(token);
    if (sessionUser) return sessionUser.id;
  }
  return 'user-alex-001';
}

// -------------------------------------------------------------
// 1. CONVERSATIONS MANAGEMENT API
// -------------------------------------------------------------

// GET /api/copilot/conversations
router.get('/conversations', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { search } = req.query;
    const conversations = Database.listCopilotConversations(userId, search as string);
    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list conversations.' });
  }
});

// POST /api/copilot/conversations
router.post('/conversations', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
router.get('/conversations/:id', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
router.patch('/conversations/:id', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
router.delete('/conversations/:id', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
router.post('/conversations/:id/clear', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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

// -------------------------------------------------------------
// 2. COPILOT GENERATION & CHAT API
// -------------------------------------------------------------

// POST /api/copilot/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
    });
  } catch (err: any) {
    console.error('Error in /api/copilot/chat:', err);
    res.status(500).json({ error: err.message || 'Copilot generation failed.' });
  }
});

// POST /api/copilot/stream (Server-Sent Events streaming)
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
router.post('/tools/execute', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
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
router.post('/practice/submit', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const {
      questionId = `q-gen-${Date.now()}`,
      subjectId = 'math',
      topic = 'STEM Practice',
      userAnswer,
      correctAnswer,
      timeSpentSeconds = 30,
    } = req.body;

    if (!userAnswer || !correctAnswer) {
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
      correctAnswer,
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

export default router;
