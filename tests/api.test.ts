import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

/**
 * HTTP-level smoke tests against the real Express app.
 *
 * The app is built lazily so the in-memory database and route modules are
 * initialised once per run. Vite middleware is skipped (NODE_ENV=test) so these
 * tests exercise the API only.
 */

let app: Express;
let token: string;

const UNIQUE_EMAIL = `apitest_${Date.now()}@learn.co`;
const PASSWORD = 'Str0ngPass!23';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const mod = await import('../server.js');
  app = await mod.createApp();

  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: UNIQUE_EMAIL, password: PASSWORD, fullName: 'API Test User' });

  expect(res.status).toBe(201);
  token = res.body.token;
}, 60_000);

describe('health & static', () => {
  it('reports healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('authentication', () => {
  it('rejects signup without an email', async () => {
    const res = await request(app).post('/api/auth/signup').send({ password: PASSWORD });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('signs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/signin').send({ email: UNIQUE_EMAIL, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app).post('/api/auth/signin').send({ email: UNIQUE_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('returns the session for a valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(UNIQUE_EMAIL);
  });
});

describe('protected endpoints reject anonymous access', () => {
  const protectedPaths = [
    ['get', '/api/user/profile'],
    ['put', '/api/user/profile'],
    ['get', '/api/user/settings'],
    ['get', '/api/user/stats'],
    ['get', '/api/analytics/dashboard'],
    ['get', '/api/planner/overview'],
    ['get', '/api/gamification/profile'],
    ['get', '/api/creator/sources'],
    ['get', '/api/copilot/conversations'],
    ['get', '/api/practice/quota'],
    ['get', '/api/mentorship/my-sessions'],
  ] as const;

  it.each(protectedPaths)('%s %s → 401', async (method, path) => {
    const res = await (request(app) as any)[method](path);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('does not leak a seeded account in a 401 body', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(JSON.stringify(res.body)).not.toContain('alex@learn.co');
  });
});

describe('authorized workflows', () => {
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('returns the current profile', async () => {
    const res = await request(app).get('/api/user/profile').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.profile.email).toBe(UNIQUE_EMAIL);
  });

  it('updates the profile', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set(auth())
      .send({ fullName: 'Renamed User' });
    expect(res.status).toBe(200);
    expect(res.body.profile.fullName).toBe('Renamed User');
  });

  it('returns curriculum data', async () => {
    const res = await request(app).get('/api/learning/curriculum').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.subjects)).toBe(true);
    expect(res.body.subjects.length).toBeGreaterThan(0);
  });

  it('returns analytics for the authenticated user', async () => {
    const res = await request(app).get('/api/analytics/dashboard').set(auth());
    expect(res.status).toBe(200);
  });

  it('starts a practice session and returns questions', async () => {
    const res = await request(app)
      .post('/api/learning/session/start')
      .set(auth())
      .send({ subjectId: 'math', questionCount: 5, difficulty: 'medium' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThan(0);
  });
});

describe('input validation', () => {
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('rejects an empty practice attempt instead of storing junk', async () => {
    const res = await request(app).post('/api/practice/submit-attempt').set(auth()).send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ATTEMPT');
    expect(res.body.error).toContain('questionId');
  });

  it('rejects a practice attempt missing isCorrect', async () => {
    const res = await request(app)
      .post('/api/practice/submit-attempt')
      .set(auth())
      .send({ questionId: 'q-1', subjectId: 'math' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('isCorrect');
  });

  it('accepts a well-formed attempt', async () => {
    const res = await request(app)
      .post('/api/practice/submit-attempt')
      .set(auth())
      .send({ questionId: 'q-1', subjectId: 'math', isCorrect: true, selectedAnswer: 'A' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns JSON (not an HTML stack trace) for malformed JSON bodies', async () => {
    const res = await request(app)
      .post('/api/practice/submit-attempt')
      .set(auth())
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.text).not.toContain('<html');
    expect(res.text).not.toContain('SyntaxError');
    expect(res.body.success).toBe(false);
  });
});

describe('unknown API routes', () => {
  it('returns a JSON 404 rather than the SPA shell', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.success).toBe(false);
  });
});
