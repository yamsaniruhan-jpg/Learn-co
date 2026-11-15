import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { CopilotGateway } from '../server/services/copilotGateway';

let app: Express, alice: string, bob: string;
const auth = (token:string) => ({Authorization:`Bearer ${token}`});
beforeAll(async () => {
  vi.stubEnv('GEMINI_API_KEY',''); vi.stubEnv('FIREBASE_ADMIN_DISABLED','true');
  app = await (await import('../server')).createApp();
  const signup = async (name:string) => {
    const res=await request(app).post('/api/auth/signup').send({email:`${name}-${Date.now()}@example.test`,password:'Password123',fullName:name});
    expect(res.status).toBe(201); return res.body.token;
  };
  alice=await signup('alice-conversation'); bob=await signup('bob-conversation');
},60000);
afterEach(()=>vi.restoreAllMocks());
const create = async () => {
  const res=await request(app).post('/api/copilot/conversations').set(auth(alice)).send({title:'Private conversation'});
  expect(res.status).toBe(201);return res.body.conversation.id as string;
};

describe('Copilot conversation authorization', () => {
  it.each(['/api/copilot/chat','/api/copilot/stream'])('rejects another account and missing conversations at %s before consuming quota', async path => {
    const id=await create();
    const before=await request(app).get('/api/copilot/quota').set(auth(bob));
    for (const conversationId of [id,'nonexistent-conversation']) {
      const result=await request(app).post(path).set(auth(bob)).send({conversationId,prompt:'test prompt'});
      expect(result.status).toBe(404);
    }
    const after=await request(app).get('/api/copilot/quota').set(auth(bob));
    expect(after.body.quota.used).toBe(before.body.quota.used);
    const conv=await request(app).get(`/api/copilot/conversations/${id}`).set(auth(alice));
    expect(conv.body.messages).toEqual([]);
  });
  it.each(['/api/copilot/chat','/api/copilot/stream'])('does not recreate a conversation deleted while %s generates', async path => {
    const id=await create(); let release!: (value:any)=>void;
    vi.spyOn(CopilotGateway,'generate').mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
    const response=request(app).post(path).set(auth(alice)).send({conversationId:id,prompt:'test prompt'}).then(r=>r);
    await vi.waitFor(()=>expect(release).toBeTypeOf('function'));
    const del=await request(app).delete(`/api/copilot/conversations/${id}`).set(auth(alice));expect(del.status).toBe(200);
    release({reply:'Synthetic answer',modelUsed:'synthetic',citations:[],toolCalls:[]});
    const result=await response;
    if(path.endsWith('/chat')) expect(result.status).toBe(409);
    else expect(result.text).toContain('Conversation is no longer available');
    const list=await request(app).get('/api/copilot/conversations').set(auth(alice));
    expect(list.body.conversations.some((c:any)=>c.id===id)).toBe(false);
    expect(list.body.conversations.some((c:any)=>c.lastMessageSnippet==='Synthetic answer')).toBe(false);
  });
});
