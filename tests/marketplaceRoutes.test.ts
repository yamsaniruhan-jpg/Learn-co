import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createRequire } from 'node:module';
let app: Express, token: string;
beforeAll(async () => {
  process.env.FIREBASE_ADMIN_DISABLED = 'true';
  app = await (await import('../server')).createApp();
  // Vitest's ESM transform and Node's CommonJS loader can hold separate copies.
  const { Database } = await import('../server/db');
  createRequire(import.meta.url)('../middleware/auth').setSessionResolver((value: string) => Database.getSessionUser(value));
  const res = await request(app).post('/api/auth/signup').send({ email: `market-${Date.now()}@example.test`, password: 'Password123', fullName: 'Marketplace Tester' });
  expect(res.status).toBe(201); token = res.body.token;
}, 60000);
describe('marketplace HTTP behavior without Firebase', () => {
  it('returns search results and rejects malformed repeated parameters', async () => {
    const result = await request(app).get('/api/marketplace/search?limit=1');
    expect(result.status).toBe(200); expect(result.body.courses).toHaveLength(1); expect(result.body.catalogSource).toBe('sample');
    expect((await request(app).get('/api/marketplace/search?subject=math&subject=cs')).status).toBe(400);
  });
  it('reports publishing as unavailable rather than claiming success', async () => {
    const response = await request(app).post('/api/marketplace/publish/test-course').set('Authorization', `Bearer ${token}`).send({ title: 'Course', description: 'Notes', subject: 'math', price: 0 });
    expect(response.status).toBe(503); expect(response.body.success).not.toBe(true);
  });
  it('rejects nonexistent enrollment and labels fallback enrollment as temporary', async () => {
    const missing = await request(app).post('/api/marketplace/enroll/not-a-course').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
    const found = await request(app).post('/api/marketplace/enroll/course-calc-mastery').set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200); expect(found.body.persistence).toBe('memory');
  });
  it('rejects overly long reviews', async () => {
    const response = await request(app).post('/api/marketplace/review/course-calc-mastery').set('Authorization', `Bearer ${token}`).send({ rating: 5, comment: 'x'.repeat(2001) });
    expect(response.status).toBe(400);
  });
});
