import { GoogleGenAI } from '@google/genai';
import { RagEngine } from './ragEngine';
import { ModelRouter } from './modelRouter';
import { CopilotCacheEngine } from './copilotCacheEngine';
import {
  CopilotMode,
  LearnerLevel,
  CopilotContextPayload,
  CopilotCitation,
  CopilotToolCall,
  CopilotArtifact,
} from '../../src/types/copilot';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-copilot',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      aiClient = null;
    }
  }
  return aiClient;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operation timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);
}

export interface CopilotGenerationResult {
  reply: string;
  modelUsed: string;
  citations: CopilotCitation[];
  toolCalls: CopilotToolCall[];
  artifact?: CopilotArtifact;
  fromCache?: boolean;
}

export class CopilotGateway {
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
  }): Promise<CopilotGenerationResult> {
    const {
      userId,
      conversationId,
      prompt,
      mode = 'socratic_hint',
      learnerLevel = 'intermediate',
      context,
      selectedModel,
    } = params;

    // Retrieve authorized context before checking the cache. Source edits or
    // deletion must change the cache key rather than serving stale private text.
    // 2. Retrieve RAG Context (Creator Studio notes, Curriculum concepts, User mistakes)
    const { chunks, citations } = RagEngine.retrieveContext(userId, prompt, context, 4);
    const ragContextFormatted = RagEngine.formatChunksForPrompt(chunks);

    // 3. Select Optimal Model & Token Cost Profile
    const routeDecision = ModelRouter.selectModel(
      prompt,
      mode,
      ragContextFormatted.length,
      selectedModel
    );

    // 4. Build Comprehensive System Prompt with pedagogical guidelines
    const systemInstruction = ModelRouter.buildSystemPrompt(
      mode,
      learnerLevel,
      context?.socraticGuidanceLevel || 'high'
    );

    // 5. Assemble Structured User Message with Boundaries
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

    fullPrompt += `[USER QUERY]:\n${prompt.trim()}`;

    const cacheKey = CopilotCacheEngine.generateKey({
      userId, prompt: fullPrompt, systemInstruction, mode, learnerLevel, modelPreference: selectedModel, citations,
    });
    const cached = CopilotCacheEngine.get(cacheKey);
    if (cached) {
      return {
        reply: cached.reply,
        modelUsed: `${cached.modelUsed} (⚡ Zero-Cost Cache)`,
        citations: cached.citations || [],
        toolCalls: [],
        fromCache: true,
      };
    }

    const ai = getGeminiClient();

    // 6. Try Real Gemini API if Available
    if (ai) {
      const candidateModels = [
        routeDecision.modelName,
        ...ModelRouter.FALLBACK_CASCADE.filter((m) => m !== routeDecision.modelName),
      ];

      for (const model of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await withTimeout(
              ai.models.generateContent({
                model,
                contents: fullPrompt,
                config: {
                  systemInstruction,
                  temperature: routeDecision.temperature,
                  maxOutputTokens: routeDecision.maxOutputTokens,
                },
              }),
              20000,
              `Gemini request to ${model} timed out after 20s`
            );

            if (response.text && response.text.trim()) {
              const rawReply = response.text.trim();

              // The former automatic artifact path inserted unrelated hard-coded
              // content. Keep the model's actual response but do not pretend that
              // a validated practice question or saved deck was created.
              const wantsArtifact = /flashcard|create cards|save deck|practice question|quiz me/i.test(prompt) || mode === 'practice_generator';
              const reply = wantsArtifact
                ? `${rawReply}\n\nAutomatic artifact creation from this response is not available. Review the answer before using it; no deck or practice question was saved.`
                : rawReply;

              // Save to Cache for subsequent identical/similar requests
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
              };
            }
          } catch (err: any) {
            const isTransient =
              err?.status === 503 ||
              err?.status === 429 ||
              err?.message?.includes?.('503') ||
              err?.message?.includes?.('429') ||
              err?.message?.includes?.('high demand') ||
              err?.message?.includes?.('quota');

            console.warn(
              `Copilot Gemini generation with ${model} (attempt ${attempt}) encountered ${isTransient ? 'transient error' : 'error'}:`,
              err?.message || err
            );

            if (isTransient && attempt === 1) {
              await new Promise((r) => setTimeout(r, 600));
              continue; // Retry once after short delay
            }
            break; // Try next fallback model
          }
        }
      }
    }

    // Do not present invented derivations, code or generated artifacts as a
    // solution when a model is unavailable.
    return {
      reply: 'AI is unavailable right now. No AI answer or artifact was generated. Please try again later or use the existing learning materials.',
      modelUsed: 'unavailable',
      citations: [],
      toolCalls: [],
      fromCache: false,
    };
  }
}
