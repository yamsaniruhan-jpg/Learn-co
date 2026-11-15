import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  retrieve: vi.fn(),
}));
vi.mock('@google/genai', () => ({ GoogleGenAI: class { models = { generateContent: mocks.generate }; } }));
vi.mock('../server/services/ragEngine', () => ({RagEngine:{
  retrieveContext: mocks.retrieve,
  formatChunksForPrompt: (chunks: Array<{text:string}>) => chunks.map(c => c.text).join('\n'),
}}));
import { CopilotGateway } from '../server/services/copilotGateway';
import { CopilotCacheEngine } from '../server/services/copilotCacheEngine';

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key'); CopilotCacheEngine.clear();
  mocks.retrieve.mockReset(); mocks.generate.mockReset();
  mocks.retrieve.mockImplementation((user: string) => ({chunks:[{text:`private notes of ${user}`}],citations:[{sourceId:user,title:`${user} notes`,sourceType:'creator_studio',snippet:`${user} private`}]}));
  mocks.generate.mockImplementation(async (request: any) => ({text:`Synthetic model reply from ${request.contents}`}));
});
afterAll(() => vi.unstubAllEnvs());

describe('Copilot cache privacy', () => {
  it('does not reuse another account’s private reply or citations', async () => {
    const a = await CopilotGateway.generate({userId:'alice', prompt:'Explain this topic'});
    const b = await CopilotGateway.generate({userId:'bob', prompt:'Explain this topic'});
    expect(a.reply).toContain('private notes of alice');
    expect(b.reply).toContain('private notes of bob');
    expect(b.reply).not.toContain('private notes of alice');
    expect(b.citations[0].sourceId).toBe('bob');
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    const aAgain = await CopilotGateway.generate({userId:'alice', prompt:'Explain this topic'});
    expect(aAgain.fromCache).toBe(true); expect(mocks.generate).toHaveBeenCalledTimes(2);
  });
  it('invalidates cache after source, active question, guidance, or meaningful punctuation changes', async () => {
    const params = {userId:'alice',prompt:'What is x?',context:{studyContextNote:'first note'}};
    await CopilotGateway.generate(params);
    await CopilotGateway.generate({...params,context:{studyContextNote:'another note'}});
    await CopilotGateway.generate({...params,prompt:'What is x!'});
    mocks.retrieve.mockReturnValue({chunks:[{text:'edited private source'}],citations:[]});
    const updated = await CopilotGateway.generate(params);
    expect(updated.reply).toContain('edited private source');
    expect(mocks.generate).toHaveBeenCalledTimes(4);
  });
  it('does not fabricate a saved deck or practice artifact after model generation', async () => {
    const result = await CopilotGateway.generate({userId:'alice',prompt:'Create a flashcard about photosynthesis'});
    expect(result.artifact).toBeUndefined(); expect(result.toolCalls).toEqual([]);
    expect(result.reply).toContain('no deck or practice question was saved');
    expect(result.reply).not.toContain('Stationary conditions and state conservation');
  });
  it('never caches results containing tool calls or artifacts', () => {
    const key='test'; const base={reply:'a sufficiently long response to be cached',modelUsed:'gemini',mode:'socratic_hint',citations:[],toolCalls:[]};
    CopilotCacheEngine.set(key,{...base,artifact:{id:'sensitive'}}); expect(CopilotCacheEngine.get(key)).toBeNull();
    CopilotCacheEngine.set(key,{...base,toolCalls:[{id:'x'}]}); expect(CopilotCacheEngine.get(key)).toBeNull();
  });
});
