import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireAuth, optionalAuth } from '../server/middleware/authMiddleware';
import { hashPassword, verifyPassword, needsPasswordRehash } from '../server/db';

/**
 * Regression tests for the authentication vulnerabilities found in the audit.
 * These guard against reintroducing the anonymous-access backdoor.
 */

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/protected', requireAuth, (req: any, res) => {
    res.json({ success: true, userId: req.userId });
  });

  app.get('/optional', optionalAuth, (req: any, res) => {
    res.json({ success: true, authenticated: Boolean(req.userId), userId: req.userId ?? null });
  });

  app.post('/protected', requireAuth, (req: any, res) => {
    res.json({ success: true, userId: req.userId });
  });

  return app;
}

describe('requireAuth — anonymous access must be rejected', () => {
  const app = buildApp();

  it('rejects a request with no Authorization header (GET)', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a request with no Authorization header (POST / write path)', async () => {
    const res = await request(app).post('/protected').send({ fullName: 'attacker' });
    expect(res.status).toBe(401);
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'NotBearer abc');
    expect(res.status).toBe(401);
  });

  it('rejects a bogus bearer token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer totally-fake-token');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_SESSION');
  });

  it('rejects the literal string "null" as a token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer null');
    expect(res.status).toBe(401);
  });

  it('never falls back to a seeded account', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain('alex');
  });
});

describe('optionalAuth — public endpoints stay public but never impersonate', () => {
  const app = buildApp();

  it('allows anonymous access without populating a user', async () => {
    const res = await request(app).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
    expect(res.body.userId).toBeNull();
  });

  it('ignores an invalid token instead of impersonating a user', async () => {
    const res = await request(app).get('/optional').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });
});

describe('password hashing', () => {
  it('produces a scrypt hash with a per-user salt', () => {
    const a = hashPassword('correct horse battery staple');
    const b = hashPassword('correct horse battery staple');
    expect(a.startsWith('scrypt$')).toBe(true);
    // Same password must produce different hashes (unique salt per user).
    expect(a).not.toBe(b);
  });

  it('verifies a correct password', () => {
    const hash = hashPassword('Str0ngPass!23');
    expect(verifyPassword('Str0ngPass!23', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('Str0ngPass!23');
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('rejects empty credentials without throwing', () => {
    expect(verifyPassword('', hashPassword('x'))).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'malformed-hash')).toBe(false);
  });

  it('still verifies legacy HMAC hashes so existing accounts can sign in', async () => {
    const crypto = await import('crypto');
    const legacy = crypto.createHmac('sha256', 'learnco_salt_2026').update('LegacyPass1!').digest('hex');
    expect(verifyPassword('LegacyPass1!', legacy)).toBe(true);
    expect(verifyPassword('WrongPass1!', legacy)).toBe(false);
  });

  it('flags legacy hashes for upgrade and leaves scrypt hashes alone', async () => {
    const crypto = await import('crypto');
    const legacy = crypto.createHmac('sha256', 'learnco_salt_2026').update('x').digest('hex');
    expect(needsPasswordRehash(legacy)).toBe(true);
    expect(needsPasswordRehash(hashPassword('x'))).toBe(false);
  });
});
