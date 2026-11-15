import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopilotClient } from '../src/services/copilotClient';
const options:any={prompt:'hello',mode:'socratic_hint',learnerLevel:'beginner'};
const stream = (text:string)=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(text));c.close();}}),{status:200});
afterEach(()=>vi.unstubAllGlobals());
describe('Copilot stream completion',()=>{
  it.each([
    ['truncated', 'data: {"type":"token","content":"partial"}\n\n'],
    ['server error', 'data: {"type":"error","error":"Conversation is no longer available."}\n\n']
  ])('reports %s streams instead of leaving the UI waiting',async (_name,text)=>{
    vi.stubGlobal('localStorage',{getItem:()=>null});vi.stubGlobal('fetch',vi.fn().mockResolvedValue(stream(text)));
    const onError=vi.fn(),onDone=vi.fn();
    await CopilotClient.streamMessage(options,{onError,onDone});
    expect(onError).toHaveBeenCalledOnce();expect(onDone).not.toHaveBeenCalled();
  });
  it('accepts a completed stream',async()=>{
    vi.stubGlobal('localStorage',{getItem:()=>null});vi.stubGlobal('fetch',vi.fn().mockResolvedValue(stream('data: {"type":"done","messageId":"m"}\n\n')));
    const onError=vi.fn(),onDone=vi.fn();await CopilotClient.streamMessage(options,{onError,onDone});
    expect(onDone).toHaveBeenCalledOnce();expect(onError).not.toHaveBeenCalled();
  });
});
