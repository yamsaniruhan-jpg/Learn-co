import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
let app: Express;
let alice: string, bob: string;
beforeAll(async () => {
  process.env.FIREBASE_ADMIN_DISABLED = 'true';
  app = await (await import('../server')).createApp();
  async function signup(name: string) {
    const response = await request(app).post('/api/auth/signup').send({ email: `${name}-${Date.now()}@example.test`, password: 'Password123', fullName: name });
    expect(response.status).toBe(201); return response.body.token;
  }
  alice = await signup('alice'); bob = await signup('bob');
}, 60000);
const body = { attemptId: 'test-offline-123', questionId: 'q-unknown', subjectId: 'math', topicId: 'algebra', selectedAnswer: 'a', isCorrect: true };
describe('practice attempt idempotency', () => {
  it('deduplicates a retry by its owner without leaking it to another account', async () => {
    const first = await request(app).post('/api/practice/submit-attempt').set('Authorization', `Bearer ${alice}`).send(body);
    const retry = await request(app).post('/api/practice/submit-attempt').set('Authorization', `Bearer ${alice}`).send(body);
    const other = await request(app).post('/api/practice/submit-attempt').set('Authorization', `Bearer ${bob}`).send(body);
    expect(first.status).toBe(200); expect(retry.status).toBe(200); expect(retry.body.xpEarned).toBe(0);
    expect(other.status).toBe(409); expect(other.body.attempt).toBeUndefined();
  });
  it.each(['__proto__', 'constructor', 'bad.id', 'x'.repeat(129)])('rejects unsafe attempt ID %s', async attemptId => {
    const result = await request(app).post('/api/practice/submit-attempt').set('Authorization', `Bearer ${alice}`).send({ ...body, attemptId });
    expect(result.status).toBe(400);
  });
});
