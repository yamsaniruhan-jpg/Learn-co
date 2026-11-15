import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { chatValidation, handleValidation, sanitizeInput } from '../middleware/validate';

const router = Router();

// Hourly AI usage tracker per user
const userAiUsageMap = new Map<string, { count: number; windowStart: number }>();

export function recordAiUsage(userId: string): number {
  const now = Date.now();
  const entry = userAiUsageMap.get(userId);
  if (!entry || now - entry.windowStart > 60 * 60 * 1000) {
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

// In-memory zero-token response cache to reduce AI costs
const aiCostReductionCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

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

  // Cost-optimized model hierarchy: start with ultra-efficient flash-latest and 3.1-flash-lite
  const models = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

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
        aiCostReductionCache.set(cacheKey, { reply: text, timestamp: Date.now() });
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
// Low-token, cost-optimized oral exam evaluation (max 180 tokens)
router.post('/voice-exam-eval', async (req: Request, res: Response) => {
  try {
    const { question, rubric, thesis = '', derivation = '', constraints = '', subject = 'STEM' } = req.body;

    const studentDefense = `[Thesis/Definition]: ${thesis}\n[Step-by-Step Derivation]: ${derivation}\n[Boundary & Invariants]: ${constraints}`.trim();

    if (!thesis.trim() && !derivation.trim()) {
      res.status(400).json({ error: 'Please provide at least a thesis or derivation for evaluation.' });
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemPrompt = 'You are a strict, objective STEM oral examination examiner. Evaluate the student defense against the reference rubric. Output JSON strictly with keys: score (number 0-100), strength (1 short sentence), missing (1 short sentence), verdict (string "PASS" if score >= 70 else "REVISE"). Keep text minimal (under 50 words).';
        const prompt = `[Question]: ${question}\n[Subject]: ${subject}\n[Key Rubric Invariant]: ${rubric}\n\n[Student Defense]:\n${studentDefense}`;

        const rawReply = await generateWithFallback(ai, prompt, systemPrompt, 140);
        const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          res.json({
            score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 75,
            strength: parsed.strength || 'Good conceptual articulation.',
            missing: parsed.missing || 'Could expand on formal edge cases.',
            verdict: parsed.verdict || (parsed.score >= 70 ? 'PASS' : 'REVISE'),
            mode: 'ai_low_token',
          });
          return;
        }
      } catch (aiErr) {
        console.warn('Voice exam AI evaluation fallback to deterministic rubric:', aiErr);
      }
    }

    // Keyword-and-length heuristic: it does not verify the correctness of an answer.
    const combinedText = `${thesis} ${derivation} ${constraints}`.toLowerCase();
    const rubricWords = (rubric || '').toLowerCase().split(/[\s,.;]+/).filter((w: string) => w.length > 3);
    const matchedWords = rubricWords.filter((w: string) => combinedText.includes(w));
    const coverage = rubricWords.length > 0 ? matchedWords.length / rubricWords.length : 0.5;

    let score = Math.round(coverage * 60);
    if (thesis.trim().length > 20) score += 15;
    if (derivation.trim().length > 40) score += 15;
    if (constraints.trim().length > 15) score += 10;
    score = Math.max(25, Math.min(98, score));

    res.json({
      score,
      strength: matchedWords.length > 0
        ? `Mentioned rubric terms: ${matchedWords.slice(0, 3).join(', ')}.`
        : 'Good effort in structuring the oral response.',
      missing: coverage < 0.6
        ? `Incorporate formal aspects from the ground-truth rubric: "${rubric}".`
        : 'Deepen the step-by-step mathematical reasoning.',
      verdict: score >= 70 ? 'PASS' : 'REVISE',
      mode: 'deterministic_offline',
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

