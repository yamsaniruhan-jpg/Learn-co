import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { chatValidation, handleValidation, sanitizeInput } from '../middleware/validate';

const router = Router();

// Hourly AI usage tracker per user (bounded to prevent memory leaks)
const userAiUsageMap = new Map<string, { count: number; windowStart: number }>();
const MAX_USAGE_ENTRIES = 2000;
const USAGE_WINDOW_MS = 60 * 60 * 1000;

export function recordAiUsage(userId: string): number {
  const now = Date.now();
  if (userAiUsageMap.size >= MAX_USAGE_ENTRIES && !userAiUsageMap.has(userId)) {
    for (const [key, val] of userAiUsageMap.entries()) {
      if (now - val.windowStart > USAGE_WINDOW_MS) userAiUsageMap.delete(key);
    }
    if (userAiUsageMap.size >= MAX_USAGE_ENTRIES) {
      const oldestKey = userAiUsageMap.keys().next().value;
      if (oldestKey !== undefined) userAiUsageMap.delete(oldestKey);
    }
  }
  const entry = userAiUsageMap.get(userId);
  if (!entry || now - entry.windowStart > USAGE_WINDOW_MS) {
    userAiUsageMap.set(userId, { count: 1, windowStart: now });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export function getAiHourlyUsage(userId: string): number {
  const now = Date.now();
  const entry = userAiUsageMap.get(userId);
  if (!entry || now - entry.windowStart > 60 * 60 * 1000) {
    return 0;
  }
  return entry.count;
}

// GET /api/ai/usage
router.get('/usage', (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.id || 'guest_user';
    const userTier = user?.subscription || 'free';
    const limit = userTier === 'super' ? 500 : userTier === 'pro' ? 100 : 10;
    const used = getAiHourlyUsage(userId);

    res.json({
      used,
      limit,
      tier: userTier,
      remaining: Math.max(0, limit - used),
      windowMs: 60 * 60 * 1000,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch AI usage.' });
  }
});

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory zero-token response cache to reduce AI costs (bounded to prevent memory leaks)
const aiCostReductionCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_AI_CACHE_ENTRIES = 500;

function setBoundedAiCache(key: string, reply: string) {
  const now = Date.now();
  if (aiCostReductionCache.size >= MAX_AI_CACHE_ENTRIES && !aiCostReductionCache.has(key)) {
    for (const [k, v] of aiCostReductionCache.entries()) {
      if (now - v.timestamp >= CACHE_TTL_MS) aiCostReductionCache.delete(k);
    }
    if (aiCostReductionCache.size >= MAX_AI_CACHE_ENTRIES) {
      const oldestKey = aiCostReductionCache.keys().next().value;
      if (oldestKey !== undefined) aiCostReductionCache.delete(oldestKey);
    }
  }
  aiCostReductionCache.set(key, { reply, timestamp: now });
}

// Resilient Gemini generateContent with cost-optimized model fallbacks and token capping
async function generateWithFallback(
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string,
  maxOutputTokens: number = 350
): Promise<string> {
  const cacheKey = `${contents}:::${systemInstruction}:::${maxOutputTokens}`;
  const cached = aiCostReductionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.reply;
  }

  // Cost-optimized valid Gemini model hierarchy
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens,
        },
      });

      if (response.text && response.text.trim()) {
        const text = response.text.trim();
        setBoundedAiCache(cacheKey, text);
        return text;
      }
    } catch (err: any) {
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes?.('503') ||
        err?.message?.includes?.('429') ||
        err?.message?.includes?.('high demand') ||
        err?.message?.includes?.('UNAVAILABLE');

      console.warn(`Gemini generation with ${model} encountered ${isTransient ? 'transient error (retrying/falling back)' : 'error'}:`, err?.message || err);
      continue;
    }
  }

  throw new Error('All Gemini AI models temporarily unavailable.');
}

// POST /api/ai/chat
router.post('/chat', chatValidation, handleValidation, async (req: Request, res: Response) => {
  try {
    const prompt = req.body.prompt || req.body.message;
    const { mode = 'socratic_hint', context } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const systemInstruction =
      mode === 'socratic_hint'
        ? 'You are the Learn.co Socratic Copilot. You guide students using first-principles questioning and diagnostic hints. NEVER directly state the final answer. Ask guiding questions, point out invariants, and help the student reason through the steps themselves.'
        : mode === 'conceptual_explainer'
        ? 'You are the Learn.co First-Principles Explainer. Break down complex STEM concepts into ground-truth intuitions, physical analogies, and mathematical foundations.'
        : 'You are the Learn.co Analytical Derivation Engine. Provide step-by-step mathematical proofs with rigorous state definitions, operators, and invariance checks.';

    const ai = getGeminiClient();

    if (ai) {
      try {
        const fullPrompt = `${context ? `[Context]: ${context}\n\n` : ''}[User Query]: ${prompt}`;
        const reply = await generateWithFallback(ai, fullPrompt, systemInstruction);
        res.json({ reply });
        return;
      } catch (aiErr) {
        console.warn('Gemini chat unavailable; serving a labelled generic prompt.');
      }
    }

    // Context-aware pedagogical fallback response
    let fallbackReply = '';
    const cleanPrompt = prompt.replace(/[^\w\s\$\+\-\*\/\=\^\(\)]/g, '').trim();

    if (mode === 'socratic_hint') {
      fallbackReply = `### Socratic Diagnostic Guidance\n\nLet's analyze your investigation into: **"${prompt.slice(0, 80)}"**\n\n1. **Fundamental Invariant**: What underlying conservation law or algebraic state balance applies here?\n2. **Boundary & Asymptotic Behavior**: What happens when the primary variable approaches $0$ or $\\infty$?\n3. **Guiding Question**: If you set the first derivative or rate of change to equilibrium ($\Delta = 0$), what relationship does your unknown term satisfy?`;
    } else if (mode === 'conceptual_explainer') {
      fallbackReply = `### First-Principles Intuitive Breakdown\n\nTo understand **"${prompt.slice(0, 70)}"**:\n\n* **Ground-Truth Foundation**: Physical and mathematical laws emerge from conservation rules, symmetrical invariance, and minimal energy states.\n* **Mental Model**: Visualize the system evolving along the direction of steepest gradient descent toward its local equilibrium well.\n* **Core Takeaway**: Rather than memorizing formulas, identify the invariant quantity that remains constant throughout the transformation.`;
    } else {
      fallbackReply = `### Step-by-Step Analytical Derivation\n\n1. **Step 1 — State & Domain Definition**: Define the objective function $f(\\mathbf{x})$ over its admissible convex domain $\\Omega$.\n2. **Step 2 — Differential Operator**: Compute the total gradient vector $\\nabla f(\\mathbf{x})$.\n3. **Step 3 — Stationarity Condition**: Enforce the first-order necessary condition $\\nabla f(\\mathbf{x}^*) = \\mathbf{0}$ to isolate critical points.\n4. **Step 4 — Curvature & Stability Test**: Compute the Hessian matrix $\\mathbf{H}(\\mathbf{x}^*)$ and verify $\\mathbf{H} \\succ 0$ (all eigenvalues $\\lambda_i > 0$) for strict local minimality.`;
    }

    res.json({ reply: `**AI is unavailable.** The following is generic guidance, not an AI-generated or verified answer.\n\n${fallbackReply}`, fallback: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI request failed.' });
  }
});

// POST /api/ai/generate-resource
router.post('/generate-resource', (_req: Request, res: Response) => {
  // This legacy endpoint used to return the same unrelated flashcards for every
  // source. Creator Studio's authenticated /api/creator/generate is the real
  // generation path; do not present fabricated content as a generated resource.
  res.status(503).json({ error: 'This legacy generator is unavailable. Use Creator Studio to generate a resource.', code: 'GENERATOR_UNAVAILABLE' });
});

// POST /api/ai/voice-exam-eval
// 100% zero-API-cost deterministic oral examination rubric scoring
router.post('/voice-exam-eval', (req: Request, res: Response) => {
  try {
    const {
      rubric = '',
      thesis = '',
      derivation = '',
      constraints = '',
      transcript = '',
    } = req.body || {};

    const cleanTranscript = String(transcript || '').trim();
    const cleanThesis = String(thesis || '').trim() || cleanTranscript;
    const cleanDerivation = String(derivation || '').trim() || cleanTranscript;
    const cleanConstraints = String(constraints || '').trim() || cleanTranscript;

    if (!cleanThesis && !cleanDerivation && !cleanTranscript) {
      res.status(400).json({ error: 'Please speak or provide an oral response before grading.' });
      return;
    }

    const combinedText = `${cleanThesis} ${cleanDerivation} ${cleanConstraints} ${cleanTranscript}`.toLowerCase();
    const rubricWords = String(rubric || '')
      .toLowerCase()
      .split(/[\s,.;:()/]+/)
      .filter((w: string) => w.length > 3);

    const uniqueRubricWords: string[] = Array.from(new Set(rubricWords));
    const matchedWords = uniqueRubricWords.filter((w: string) => combinedText.includes(w));
    const missingWords = uniqueRubricWords.filter((w: string) => !combinedText.includes(w));
    const coverage = uniqueRubricWords.length > 0 ? matchedWords.length / uniqueRubricWords.length : 0.5;

    const thesisScore = Math.min(30, Math.round((Math.min(cleanThesis.length, 140) / 140) * 14 + coverage * 16));
    const derivationScore = Math.min(45, Math.round((Math.min(cleanDerivation.length, 240) / 240) * 20 + coverage * 25));
    const boundaryScore = Math.min(25, Math.round((Math.min(cleanConstraints.length, 120) / 120) * 12 + coverage * 13));

    const score = Math.max(25, Math.min(100, thesisScore + derivationScore + boundaryScore));

    res.json({
      score,
      strength:
        matchedWords.length > 0
          ? `Covered core rubric concepts: ${matchedWords.slice(0, 4).join(', ')}.`
          : 'Structured spoken response recorded cleanly.',
      missing:
        missingWords.length > 0
          ? `Next step: explicitly include ${missingWords.slice(0, 3).join(', ')} from "${rubric}".`
          : 'Strong rubric alignment across definition, mechanism, and boundary conditions.',
      verdict: score >= 70 ? 'PASS' : 'REVISE',
      mode: 'deterministic_offline',
      apiCostTokens: 0,
      rubricBreakdown: {
        thesisScore,
        derivationScore,
        boundaryScore,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation failed.' });
  }
});

// POST /api/ai/generate-content
router.post('/generate-content', async (req: Request, res: Response) => {
  try {
    const { topic, type = 'summary', subject = 'STEM' } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Generate high-yield educational study notes for the topic: "${topic || 'Core STEM Concept'}" in subject: "${subject}". Include fundamental definitions, core invariants, and a practical application checklist.`;
        const systemInstruction = 'You are an elite academic curriculum architect. Provide rigorous, clear, markdown-formatted study notes with key principles highlighted.';
        const content = await generateWithFallback(ai, prompt, systemInstruction, 500);
        res.json({ success: true, topic, content, generatedAt: new Date().toISOString() });
        return;
      } catch (aiErr) {
        console.warn('Gemini generate-content fallback:', aiErr);
      }
    }

    res.json({
      success: true,
      topic: topic || 'Core Principle',
      fallback: true,
      content: `**AI is unavailable.** The following is generic guidance, not a verified topic summary.\n\n### Study Guidance: ${topic || 'Key Concept'}\n\n* **Core Idea**: Understanding ${subject} requires identifying core invariants and boundary conditions.\n* **Key Takeaway**: Apply active recall and spaced practice to lock in retention.`,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Content generation failed.' });
  }
});

// POST /api/ai/copilot/chat
router.post('/copilot/chat', chatValidation, handleValidation, async (req: Request, res: Response) => {
  try {
    const prompt = req.body.prompt || req.body.message;
    const { mode = 'socratic_hint', context } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const fullPrompt = `${context ? `[Context]: ${context}\n\n` : ''}[Student Query]: ${prompt}`;
        const systemInstruction = 'You are the Learn.co Socratic Copilot. Guide the learner with probing questions and diagnostic hints rather than giving away answers immediately.';
        const reply = await generateWithFallback(ai, fullPrompt, systemInstruction, 350);
        res.json({ reply, mode, context });
        return;
      } catch (aiErr) {
        console.warn('Gemini copilot/chat fallback:', aiErr);
      }
    }

    res.json({
      fallback: true,
      reply: `**AI is unavailable.** The following is generic guidance, not an AI-generated or verified answer.\n\n### Socratic Diagnostic Hint\n\nRegarding: "${prompt.slice(0, 100)}"\n\n1. What is the fundamental conservation law or invariant at play?\n2. What does setting the rate of change to zero ($\Delta = 0$) yield?`,
      mode,
      context,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Copilot chat failed.' });
  }
});

// POST /api/ai/quiz/generate
router.post('/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { subject = 'Math', topic = 'Calculus', difficulty = 'medium', count = 3 } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Generate ${Math.min(count, 5)} multiple-choice practice questions on "${topic}" in ${subject} (${difficulty} difficulty). Return valid JSON array of objects with keys: id, questionText, options (array of 4 strings), correctAnswer (exact matching option string), explanation.`;
        const raw = await generateWithFallback(ai, prompt, 'You are an expert exam question author. Output strictly valid JSON without code fences or surrounding text.', 600);
        const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          res.json({ success: true, subject, topic, questions });
          return;
        }
      } catch (aiErr) {
        console.warn('Gemini quiz/generate fallback:', aiErr);
      }
    }

    res.status(503).json({ error: 'AI quiz generation is temporarily unavailable. Please try again later.', code: 'AI_UNAVAILABLE' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Quiz generation failed.' });
  }
});

// POST /api/ai/recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { currentSubject = 'math', weaknesses = [] } = req.body;
    res.json({
      success: true,
      recommendations: [
        {
          type: 'review_concept',
          title: `Review Core Fundamentals in ${currentSubject}`,
          reason: weaknesses.length > 0
            ? `Identified lower accuracy in: ${weaknesses.slice(0, 2).join(', ')}.`
            : 'Reinforces baseline conceptual strength before advancing to higher difficulty.',
          priority: 'high',
        },
        {
          type: 'practice_drill',
          title: 'Complete 5-Question Daily Sprint',
          reason: 'Consolidates memory retrieval speed under time constraints.',
          priority: 'medium',
        },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Recommendation engine failed.' });
  }
});

export default router;

