import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  retrieve: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generate };
  },
}));

vi.mock('../server/services/ragEngine', () => ({
  RagEngine: {
    retrieveContext: mocks.retrieve,
    formatChunksForPrompt: (chunks: Array<{ text: string }>) => chunks.map((c) => c.text).join('\n'),
  },
}));

import { CopilotGateway, sanitizeImageAttachment } from '../server/services/copilotGateway';
import { CopilotCacheEngine } from '../server/services/copilotCacheEngine';
import { CopilotClient } from '../src/services/copilotClient';

beforeEach(() => {
  CopilotCacheEngine.clear();
  mocks.retrieve.mockReset().mockReturnValue({ chunks: [], citations: [] });
  mocks.generate.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Omni Copilot missing-key, timeout, hint-first, image & stream recovery', () => {
  it('returns friendly fallback message and same-topic practice questions when GEMINI_API_KEY is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const res = await CopilotGateway.generate({
      userId: 'student-1',
      prompt: 'How do I find critical points using derivatives in calculus?',
      context: { subjectId: 'math' },
    });

    expect(res.modelUsed).toBe('unavailable');
    expect(res.unavailableReason).toBe('API_KEY_MISSING');
    expect(res.reply).toMatch(/practice/i);
    expect(res.fallbackPracticeQuestions).toBeDefined();
    expect(res.fallbackPracticeQuestions!.length).toBeGreaterThan(0);
    expect(res.fallbackPracticeQuestions![0].subjectId).toBe('math');
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it('tries fallback models and returns TIMEOUT + practice questions if all models time out', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-key');
    mocks.generate.mockImplementation(
      () => new Promise(() => {
        // Never resolves -> simulates stalled upstream exceeding timeout
      })
    );

    const res = await CopilotGateway.generate({
      userId: 'student-2',
      prompt: 'Explain Newton second law force and acceleration',
      context: { subjectId: 'physics' },
      timeoutMs: 25,
    });

    expect(mocks.generate.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(res.modelUsed).toBe('unavailable');
    expect(res.unavailableReason).toBe('TIMEOUT');
    expect(res.reply).toMatch(/timed out/i);
    expect(res.fallbackPracticeQuestions?.some((q) => q.subjectId === 'physics')).toBe(true);
  });

  it('recovers via fallback cascade when the primary model times out', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-key');
    let calls = 0;
    mocks.generate.mockImplementation(async (req: any) => {
      calls += 1;
      if (calls === 1) {
        return new Promise(() => {
          // First model hangs past timeout
        });
      }
      return { text: `**Answer:** Derived on ${req.model}.\n**Step-by-step:**\n1. Step one.\n**Check yourself:** Ready?` };
    });

    const res = await CopilotGateway.generate({
      userId: 'student-3',
      prompt: 'Derive Euler formula',
      mode: 'exam_solver',
      timeoutMs: 25,
    });

    expect(res.modelUsed).not.toBe('unavailable');
    expect(res.reply).toContain('**Answer:**');
    expect(res.reply).toContain('**Step-by-step:**');
    expect(res.reply).toContain('**Check yourself:**');
  });

  it('supports hint-first mode and reveals full solution on explicit request', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-key');
    mocks.generate.mockImplementation(async (req: any) => {
      const sys = String(req.config?.systemInstruction || '');
      if (/hint-first mode/i.test(sys)) {
        return { text: '**Hint:** Differentiate first.\n**Check yourself:** What is $f\'(x)$?' };
      }
      return { text: '**Answer:** x = 3.\n**Step-by-step:**\n1. Differentiate.\n**Check yourself:** Verify at x = 0.' };
    });

    const hintRes = await CopilotGateway.generate({
      userId: 'student-4',
      prompt: 'Find critical points of x^2 - 6x',
      hintFirst: true,
    });
    expect(hintRes.hintOnly).toBe(true);
    expect(hintRes.reply).toContain('**Hint:**');

    const fullRes = await CopilotGateway.generate({
      userId: 'student-4',
      prompt: 'Find critical points of x^2 - 6x',
      hintFirst: true,
      revealFullSolution: true,
    });
    expect(fullRes.hintOnly).toBe(false);
    expect(fullRes.reply).toContain('**Answer:**');
  });

  it('forwards valid image attachments as inlineData and rejects unsupported image MIME types', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-key');
    mocks.generate.mockResolvedValue({
      text: '**Answer:** x = 4.\n**Step-by-step:**\n1. Read equation from photo.\n**Check yourself:** Check x = 4.',
    });

    expect(() =>
      sanitizeImageAttachment({ mimeType: 'image/svg+xml' as any, data: 'abc' })
    ).toThrow(/Unsupported image format/i);

    const res = await CopilotGateway.generate({
      userId: 'student-5',
      prompt: '',
      imageAttachment: {
        mimeType: 'image/png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        name: 'problem.png',
      },
    });

    expect(res.modelUsed).toBe('gemini-2.5-flash');
    const sentContents = mocks.generate.mock.calls[0][0].contents;
    expect(Array.isArray(sentContents)).toBe(true);
    expect(sentContents[0].inlineData.mimeType).toBe('image/png');
  });

  it('recovers from SSE mid-stream disconnect when recoverOnDisconnect is enabled', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('document', { cookie: '' });

    const partialStream = new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(
            new TextEncoder().encode(
              'data: {"type":"token","content":"**Answer:** ", "conversationId":"conv-rec-1"}\n\n'
            )
          );
          c.close();
        },
      }),
      { status: 200 }
    );

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(partialStream)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            conversation: { id: 'conv-rec-1' },
            messages: [
              {
                id: 'msg-rec-1',
                role: 'assistant',
                content: '**Answer:** Force equals ma.\n**Step-by-step:**\n1. F = ma.\n**Check yourself:** Units?',
                modelUsed: 'gemini-2.5-flash',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    vi.stubGlobal('fetch', fetchMock);

    const tokens: string[] = [];
    const onReconnecting = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await CopilotClient.streamMessage(
      { prompt: 'Newton second law', mode: 'conceptual_explainer', learnerLevel: 'intermediate' },
      {
        onToken: (t) => tokens.push(t),
        onReconnecting,
        onDone,
        onError,
      },
      undefined,
      { recoverOnDisconnect: true }
    );

    expect(onReconnecting).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledOnce();
    expect(tokens.join('')).toContain('**Answer:** Force equals ma.');
  });
});
