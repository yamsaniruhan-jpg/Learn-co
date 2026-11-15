import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
let app: Express, token: string;
beforeAll(async () => {
  vi.stubEnv('GEMINI_API_KEY', '');
  vi.stubEnv('FIREBASE_ADMIN_DISABLED', 'true');
  app = await (await import('../server')).createApp();
  const signup = await request(app).post('/api/auth/signup').send({ email: `fallback-${Date.now()}@example.test`, password: 'Password123', fullName: 'Fallback Test' });
  expect(signup.status).toBe(201); token = signup.body.token;
}, 60000);

describe('AI fallback disclosure', () => {
  it('marks template creator drafts and preserves the marker when reloaded', async () => {
    const response = await request(app).post('/api/creator/generate').set('Authorization', `Bearer ${token}`).send({
      sourceType: 'text', sourceText: 'A calculus derivative describes the instantaneous rate of change.',
      resourceType: 'flashcards', title: 'Calculus', subjectId: 'math', difficulty: 'medium',
    });
    expect(response.status).toBe(201);
    expect(response.body.resource.tags).toContain('template-generated');
    expect(response.body.resource.tags).not.toContain('ai-generated');
    const detail = await request(app).get(`/api/creator/resources/${response.body.resource.id}`).set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.resource.tags).toContain('template-generated');
  });
  it('does not fabricate a Copilot answer, code, citations, or artifact when the model is unavailable', async () => {
    const before = await request(app).get('/api/copilot/quota').set('Authorization', `Bearer ${token}`);
    const response = await request(app).post('/api/copilot/chat').set('Authorization', `Bearer ${token}`).send({prompt:'Write code to solve the heat equation', mode:'code_tutor'});
    expect(response.status).toBe(200);
    expect(response.body.message.content).toContain('AI is unavailable');
    expect(response.body.modelUsed).toBe('unavailable');
    expect(response.body.message.content).not.toContain('production-grade');
    expect(response.body.citations).toEqual([]);
    expect(response.body.artifact).toBeUndefined();
    const after = await request(app).get('/api/copilot/quota').set('Authorization', `Bearer ${token}`);
    expect(after.body.quota.used).toBe(before.body.quota.used);
    expect(response.body.doubtQuota.used).toBe(before.body.quota.used);
  });
  it('does not consume quota for an unavailable streamed model', async () => {
    const before = await request(app).get('/api/copilot/quota').set('Authorization', `Bearer ${token}`);
    const response = await request(app).post('/api/copilot/stream').set('Authorization', `Bearer ${token}`).send({prompt:'Explain an integral'});
    expect(response.status).toBe(200); expect(response.text).toContain('unavailable');
    const after = await request(app).get('/api/copilot/quota').set('Authorization', `Bearer ${token}`);
    expect(after.body.quota.used).toBe(before.body.quota.used);
  });
  it('labels generic chat guidance when AI is unavailable', async () => {
    const response = await request(app).post('/api/ai/chat').set('Authorization', `Bearer ${token}`).send({ prompt: 'Explain the meaning of a derivative.', mode: 'conceptual_explainer' });
    expect(response.status).toBe(200);
    expect(response.body.fallback).toBe(true);
    expect(response.body.reply).toContain('AI is unavailable');
  });
});
