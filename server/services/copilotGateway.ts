import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { RagEngine } from './ragEngine';
import { ModelRouter } from './modelRouter';
import { CopilotCacheEngine } from './copilotCacheEngine';
import { MASTER_QUESTION_BANK } from '../data/questionBankData';
import {
  CopilotMode,
  LearnerLevel,
  CopilotContextPayload,
  CopilotCitation,
  CopilotToolCall,
  CopilotArtifact,
  CopilotImageAttachment,
  CopilotFallbackQuestion,
  CopilotUnavailableReason,
} from '../../src/types/copilot';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    cachedClient = null;
    cachedApiKey = undefined;
    return null;
  }

  if (!cachedClient || cachedApiKey !== apiKey) {
    try {
      cachedClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      cachedApiKey = apiKey;
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      cachedClient = null;
      cachedApiKey = undefined;
    }
  }
  return cachedClient;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operation timed out'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_IMAGE_BASE64_LENGTH = 5_500_000;

export function sanitizeImageAttachment(input?: CopilotImageAttachment | null): CopilotImageAttachment | undefined {
  if (!input || typeof input !== 'object') return undefined;
  if (!ALLOWED_IMAGE_MIMES.has(input.mimeType)) {
    throw new Error('Unsupported image format. Please upload PNG, JPEG, or WebP.');
  }
  if (typeof input.data !== 'string' || !input.data.trim()) {
    throw new Error('Attached image is empty.');
  }
  const stripped = input.data.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();
  if (!stripped || stripped.length > MAX_IMAGE_BASE64_LENGTH) {
    throw new Error('Attached image exceeds the 4 MB limit.');
  }
  return {
    mimeType: input.mimeType,
    data: stripped,
    name: typeof input.name === 'string' ? input.name.slice(0, 80) : undefined,
  };
}

const SUBJECT_KEYWORDS: Array<{ subjectId: string; keywords: RegExp }> = [
  { subjectId: 'math', keywords: /\b(calc|calculus|derivative|integral|limit|differentiab|matrix|eigen|trig|polynomial|extrema|theorem|algebra|probability|math)\b/i },
  { subjectId: 'physics', keywords: /\b(force|newton|momentum|energy|torque|electric|magnetic|circuit|wave|optics|quantum|kinematic|gravity|physics|velocity|thermodynamic)\b/i },
  { subjectId: 'chemistry', keywords: /\b(chem|chemistry|mole|molar|orbital|reaction|sn1|sn2|acid|base|ph|equilibrium|enthalpy|gibbs|organic|inorganic|bond|hybridization)\b/i },
  { subjectId: 'biology', keywords: /\b(bio|biology|cell|dna|rna|mitochondria|enzyme|genetics|photosynthesis|respiration|nervous|evolution|atp|protein)\b/i },
  { subjectId: 'cs', keywords: /\b(python|code|function|algorithm|complexity|tree|graph|dp|recursion|array|sort|sql|class|loop|binary)\b/i },
  { subjectId: 'ai_ml', keywords: /\b(gradient|neural|backprop|loss|softmax|transformer|attention|overfitting|regression|classification|machine learning)\b/i },
];

export function selectFallbackPracticeQuestions(
  prompt: string,
  context?: CopilotContextPayload,
  limit = 3
): CopilotFallbackQuestion[] {
  const lowerPrompt = prompt.toLowerCase();
  const explicitSubject = context?.subjectId || context?.activeQuestion?.subjectId;
  const inferredSubject =
    explicitSubject ||
    SUBJECT_KEYWORDS.find((entry) => entry.keywords.test(lowerPrompt))?.subjectId;

  const tokens = Array.from(
    new Set(
      lowerPrompt
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 4)
    )
  );

  const scored = MASTER_QUESTION_BANK.filter(
    (q) => Array.isArray(q.options) && q.options.length >= 2
  ).map((q) => {
    let score = 0;
    if (inferredSubject && q.subjectId === inferredSubject) score += 10;
    if (context?.topicId && q.topicId === context.topicId) score += 8;
    const haystack = `${q.topicId} ${q.questionText} ${(q.tags || []).join(' ')}`.toLowerCase();
    for (const tok of tokens) {
      if (haystack.includes(tok)) score += 3;
    }
    return { q, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const seenTopics = new Set<string>();
  const picked: CopilotFallbackQuestion[] = [];
  for (const item of scored) {
    if (picked.length >= limit) break;
    // Prefer distinct questions/topics when possible
    if (seenTopics.has(item.q.id)) continue;
    seenTopics.add(item.q.id);
    picked.push({
      id: item.q.id,
      subjectId: item.q.subjectId,
      topicId: item.q.topicId,
      difficulty: item.q.difficulty,
      questionText: item.q.questionText,
      options: item.q.options || [],
      correctAnswer: item.q.correctAnswer as any,
      explanation: item.q.explanation,
    });
  }
  return picked;
}

export interface CopilotGenerationResult {
  reply: string;
  modelUsed: string;
  citations: CopilotCitation[];
  toolCalls: CopilotToolCall[];
  artifact?: CopilotArtifact;
  fromCache?: boolean;
  hintOnly?: boolean;
  unavailableReason?: CopilotUnavailableReason;
  fallbackPracticeQuestions?: CopilotFallbackQuestion[];
}

export class CopilotGateway {
  static readonly REQUEST_TIMEOUT_MS = 20000;

  /**
   * Main entrypoint for Copilot generation with full RAG context and fallback resilience
   */
  static async generate(params: {
    userId: string;
    conversationId?: string;
    prompt: string;
    mode?: CopilotMode;
    learnerLevel?: LearnerLevel;
    context?: CopilotContextPayload;
    selectedModel?: string;
    hintFirst?: boolean;
    revealFullSolution?: boolean;
    imageAttachment?: CopilotImageAttachment;
    timeoutMs?: number;
  }): Promise<CopilotGenerationResult> {
    const {
      userId,
      prompt,
      mode = 'socratic_hint',
      learnerLevel = 'intermediate',
      context,
      selectedModel,
      hintFirst = false,
      revealFullSolution = false,
      imageAttachment,
      timeoutMs = CopilotGateway.REQUEST_TIMEOUT_MS,
    } = params;

    const effectiveHintFirst = Boolean(hintFirst && !revealFullSolution);
    const validImage = sanitizeImageAttachment(imageAttachment);
    const effectivePrompt = prompt.trim() || (validImage ? 'Solve and explain the question shown in this image.' : '');

    // Retrieve authorized context before checking the cache. Source edits or
    // deletion must change the cache key rather than serving stale private text.
    const { chunks, citations } = RagEngine.retrieveContext(userId, effectivePrompt, context, 4);
    const ragContextFormatted = RagEngine.formatChunksForPrompt(chunks);

    const routeDecision = ModelRouter.selectModel(
      effectivePrompt,
      mode,
      ragContextFormatted.length,
      selectedModel,
      Boolean(validImage)
    );

    const systemInstruction = ModelRouter.buildSystemPrompt(
      mode,
      learnerLevel,
      context?.socraticGuidanceLevel || 'high',
      effectiveHintFirst
    );

    let fullPrompt = '';
    if (context?.activeQuestion) {
      fullPrompt += `[ACTIVE PRACTICE QUESTION CONTEXT]:
Question: "${context.activeQuestion.questionText}"
User Answer Given: "${context.activeQuestion.userAnswer || 'Not yet submitted'}"
Authoritative Answer: "${context.activeQuestion.correctAnswer || 'Unknown'}"
Explanation: "${context.activeQuestion.explanation || ''}"\n\n`;
    }

    if (context?.studyContextNote) {
      fullPrompt += `[STUDENT NOTE/FOCUS]: ${context.studyContextNote}\n\n`;
    }

    if (ragContextFormatted) {
      fullPrompt += `${ragContextFormatted}\n\n`;
    }

    if (revealFullSolution) {
      fullPrompt += `[INSTRUCTION]: The student requested the full step-by-step solution now. Provide Answer, Step-by-step, and Check yourself.\n\n`;
    }

    fullPrompt += `[USER QUERY]:\n${effectivePrompt}`;

    const imageDigest = validImage
      ? createHash('sha256').update(`${validImage.mimeType}:${validImage.data}`).digest('hex')
      : undefined;

    const cacheKey = CopilotCacheEngine.generateKey({
      userId,
      prompt: fullPrompt,
      systemInstruction,
      mode,
      learnerLevel,
      modelPreference: selectedModel,
      citations,
      hintFirst: effectiveHintFirst,
      revealFullSolution,
      imageDigest,
    });
    const cached = CopilotCacheEngine.get(cacheKey);
    if (cached) {
      return {
        reply: cached.reply,
        modelUsed: `${cached.modelUsed} (⚡ Zero-Cost Cache)`,
        citations: cached.citations || [],
        toolCalls: [],
        fromCache: true,
        hintOnly: effectiveHintFirst,
      };
    }

    const ai = getGeminiClient();
    let sawTimeout = false;

    if (ai) {
      const candidateModels = [
        routeDecision.modelName,
        ...ModelRouter.FALLBACK_CASCADE.filter((m) => m !== routeDecision.modelName),
      ];

      const requestContents: any = validImage
        ? [
            {
              inlineData: {
                mimeType: validImage.mimeType,
                data: validImage.data,
              },
            },
            { text: fullPrompt },
          ]
        : fullPrompt;

      for (const model of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await withTimeout(
              ai.models.generateContent({
                model,
                contents: requestContents,
                config: {
                  systemInstruction,
                  temperature: routeDecision.temperature,
                  maxOutputTokens: routeDecision.maxOutputTokens,
                },
              }),
              timeoutMs,
              `Gemini request to ${model} timed out after ${Math.round(timeoutMs / 1000)}s`
            );

            if (response.text && response.text.trim()) {
              const rawReply = response.text.trim();

              const wantsArtifact =
                /flashcard|create cards|save deck|practice question|quiz me/i.test(effectivePrompt) ||
                mode === 'practice_generator';
              const reply = wantsArtifact
                ? `${rawReply}\n\nAutomatic artifact creation from this response is not available. Review the answer before using it; no deck or practice question was saved.`
                : rawReply;

              CopilotCacheEngine.set(cacheKey, {
                reply,
                modelUsed: model,
                mode,
                citations,
                toolCalls: [],
              });

              return {
                reply,
                modelUsed: model,
                citations,
                toolCalls: [],
                fromCache: false,
                hintOnly: effectiveHintFirst,
              };
            }
          } catch (err: any) {
            const msg = String(err?.message || err || '');
            if (/timed out/i.test(msg)) {
              sawTimeout = true;
            }
            const isTransient =
              err?.status === 503 ||
              err?.status === 429 ||
              msg.includes('503') ||
              msg.includes('429') ||
              msg.includes('high demand') ||
              msg.includes('quota');

            console.warn(
              `Copilot Gemini generation with ${model} (attempt ${attempt}) encountered ${isTransient ? 'transient error' : 'error'}:`,
              msg
            );

            if (isTransient && attempt === 1) {
              await new Promise((r) => setTimeout(r, 600));
              continue;
            }
            break;
          }
        }
      }
    }

    const unavailableReason: CopilotUnavailableReason = !ai
      ? 'API_KEY_MISSING'
      : sawTimeout
      ? 'TIMEOUT'
      : 'MODEL_UNAVAILABLE';

    const fallbackPracticeQuestions = selectFallbackPracticeQuestions(effectivePrompt, context, 3);
    const friendlyReply =
      unavailableReason === 'API_KEY_MISSING'
        ? 'AI tutor is currently offline because the server AI key is not configured. Retry later, or practice these verified questions on the same topic below.'
        : unavailableReason === 'TIMEOUT'
        ? 'The AI tutor timed out after 20s while waiting for a model response. Tap Retry below, or solve these practice questions on the same topic.'
        : 'AI models are temporarily busy or unreachable right now. Tap Retry below, or work through these practice questions on the same topic.';

    return {
      reply: friendlyReply,
      modelUsed: 'unavailable',
      citations: [],
      toolCalls: [],
      fromCache: false,
      hintOnly: false,
      unavailableReason,
      fallbackPracticeQuestions,
    };
  }
}
