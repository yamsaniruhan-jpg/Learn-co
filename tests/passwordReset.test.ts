import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

/**
 * Password reset (B4). Before this existed there was no recovery path at all: a
 * user who forgot their password was permanently locked out.
 *
 * These tests assert the security properties, not just the happy path — every
 * one of them corresponds to a way a reset endpoint can be abused.
 */

let app: Express;
let warnSpy: ReturnType<typeof vi.spyOn>;

const uniqueEmail = () => `reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.co`;
const PASSWORD = 'InitialPass123';

async function signUp(email: string) {
  return request(app)
    .post('/api/auth/signup')
    .send({ email, password: PASSWORD, fullName: 'Reset Tester' });
}

/**
 * Ask for a reset and recover the token the way a *user* would.
 *
 * The API deliberately never returns the token. With no mail provider configured
 * the server writes it to its own log instead, so the test reads that log — the
 * same path the operator uses. No test-only backdoor exists in the app.
 */
async function requestToken(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/forgot-password').send({ email });
  expect(res.status).toBe(200);

  const logged = [...warnSpy.mock.calls]
    .map((c) => c.join(' '))
    .reverse()
    .find((line) => line.includes(email) && line.includes('reset_token='));

  expect(logged, 'server should log the reset link when no mail provider is set').toBeTruthy();
  const match = logged!.match(/reset_token=([A-Za-z0-9]+)/);
  expect(match).toBeTruthy();
  return match![1];
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.LEARNCO_DB_FILE = `/tmp/learnco-reset-${process.pid}.json`;
  // Capture the operator-console link without polluting test output.
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const mod = await import('../server.js');
  app = await mod.createApp();
}, 60_000);

afterAll(() => {
  warnSpy?.mockRestore();
  delete process.env.LEARNCO_DB_FILE;
});

describe('password reset', () => {
  it('does not reveal whether an address is registered', async () => {
    const known = uniqueEmail();
    await signUp(known);

    const a = await request(app).post('/api/auth/forgot-password').send({ email: known });
    const b = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@nowhere.test' });

    expect(a.status).toBe(b.status);
    // Identical body: same keys, same values — nothing that distinguishes an
    // existing account from a missing one.
    expect(a.body).toEqual(b.body);
    expect(JSON.stringify(a.body)).toBe(JSON.stringify(b.body));
  });

  it('uses the configured reset origin rather than the request Origin header', async () => {
    const email = uniqueEmail();
    await signUp(email);
    const previous = process.env.APP_URL;
    process.env.APP_URL = 'https://learn.example';
    try {
      const response = await request(app).post('/api/auth/forgot-password')
        .set('Origin', 'https://attacker.example').send({ email });
      expect(response.status).toBe(200);
      const logged = warnSpy.mock.calls.map((line) => line.join(' ')).reverse()
        .find((line) => line.includes(email) && line.includes('reset_token='));
      expect(logged).toContain('https://learn.example/?reset_token=');
      expect(logged).not.toContain('attacker.example');
    } finally {
      if (previous === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = previous;
    }
  });

  it('does not log reset tokens in API request paths', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const token = 'test-secret-token-123';
      await request(app).get(`/api/auth/reset-password/${token}`);
      const messages = log.mock.calls.map((line) => line.join(' ')).join('\n');
      expect(messages).not.toContain(token);
      expect(messages).toContain('[REDACTED]');
    } finally {
      log.mockRestore();
    }
  });

  it('never returns the reset token in the HTTP response', async () => {
    const email = uniqueEmail();
    await signUp(email);

    const res = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
    // The token must reach the user out-of-band (email or operator log), never the
    // API response — otherwise knowing an address is enough to take the account.
    expect(JSON.stringify(res.body)).not.toMatch(/resetUrl|reset_token/);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects a malformed email with 400 but keeps the message generic', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/i);
  });

  it('completes a full reset and signs the user in', async () => {
    const email = uniqueEmail();
    await signUp(email);
    const token = await requestToken(email);

    // Link is valid before use…
    const check = await request(app).get(`/api/auth/reset-password/${token}`);
    expect(check.body.valid).toBe(true);

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'BrandNew456' });

    expect(reset.status).toBe(200);
    expect(reset.body.success).toBe(true);
    // A fresh session token is issued so the user is not bounced to the login screen.
    expect(reset.body.token).toBeTruthy();

    // Old password is dead, new password works.
    const oldLogin = await request(app).post('/api/auth/signin').send({ email, password: PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/signin').send({ email, password: 'BrandNew456' });
    expect(newLogin.status).toBe(200);
  });

  it('makes the token single-use', async () => {
    const email = uniqueEmail();
    await signUp(email);
    const token = await requestToken(email);

    await request(app).post('/api/auth/reset-password').send({ token, password: 'FirstPass123' });
    const replay = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'SecondPass456' });

    expect(replay.status).toBe(400);
    expect(replay.body.error).toMatch(/invalid|expired|used/i);
  });

  it('enforces the password policy', async () => {
    const email = uniqueEmail();
    await signUp(email);
    const token = await requestToken(email);

    const tooShort = await request(app).post('/api/auth/reset-password').send({ token, password: 'Ab1' });
    expect(tooShort.status).toBe(400);
    expect(tooShort.body.error).toMatch(/8 characters/i);

    const noDigit = await request(app).post('/api/auth/reset-password').send({ token, password: 'onlyletters' });
    expect(noDigit.status).toBe(400);
    expect(noDigit.body.error).toMatch(/number/i);

    // A rejected attempt must NOT burn the token.
    const ok = await request(app).post('/api/auth/reset-password').send({ token, password: 'ValidPass123' });
    expect(ok.status).toBe(200);
  });

  it('revokes existing sessions when the password changes', async () => {
    const email = uniqueEmail();
    const signup = await signUp(email);
    const oldSession = signup.body.token;
    expect(oldSession).toBeTruthy();

    // The old session works…
    const before = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${oldSession}`);
    expect(before.status).toBe(200);

    const token = await requestToken(email);
    await request(app).post('/api/auth/reset-password').send({ token, password: 'RotatedPass789' });

    // …and must be dead afterwards, or a stolen session would survive the reset.
    const after = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${oldSession}`);
    expect(after.status).toBe(401);
  });

  it('rejects unknown and empty tokens', async () => {
    const unknown = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'f'.repeat(64), password: 'ValidPass123' });
    expect(unknown.status).toBe(400);

    const empty = await request(app).post('/api/auth/reset-password').send({ token: '', password: 'ValidPass123' });
    expect(empty.status).toBe(400);
  });
});

describe('admin-only endpoints (S3)', () => {
  it('refuses a signed-in student the system webhook configuration', async () => {
    const email = uniqueEmail();
    const signup = await signUp(email);
    const token = signup.body.token;
    expect(token).toBeTruthy();

    // A normal scholar must not be able to read the global alert webhook config.
    const read = await request(app).get('/api/analytics/webhook-config').set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(403); // Non-admins must be denied.

    // …nor rewrite it. Previously any signed-in user could do both.
    const write = await request(app)
      .post('/api/analytics/webhook-config')
      .set('Authorization', `Bearer ${token}`)
      .send({ enabled: true, webhookUrl: 'https://attacker.example/hook' });
    expect(write.status).toBe(403);

    const dispatch = await request(app).post('/api/analytics/test-webhook').set('Authorization', `Bearer ${token}`);
    expect(dispatch.status).toBe(403);
  });

  it('still rejects anonymous callers with 401', async () => {
    const res = await request(app).get('/api/analytics/webhook-config');
    expect(res.status).toBe(401);
  });
});
