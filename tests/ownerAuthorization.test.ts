import { beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type { Express } from 'express';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock('../server/services/firebaseAdmin', () => ({ adminAuth: { verifyIdToken }, adminDb: null }));

const owner = 'yamsaniruhan@gmail.com';
let app: Express;
let Database: typeof import('../server/db').Database;
let passwordToken: string;
let ownerId: string;

beforeAll(async () => {
  process.env.LEARNCO_DB_FILE = join(mkdtempSync(join(tmpdir(), 'learnco-owner-auth-')), 'db.json');
  const server = await import('../server');
  Database = (await import('../server/db')).Database;
  app = await server.createApp();
});

describe('owner authorization is bound to verified identity', () => {
  it('does not promote an owner-email password signup, even with an old persisted admin role', async () => {
    const signup = await request(app).post('/api/auth/signup').send({ email: owner, password: 'LocalPass123!', fullName: 'Unverified' });
    expect(signup.status).toBe(201);
    expect(signup.body.user.role).toBe('student');
    expect(signup.body.profile.role).toBe('student');
    passwordToken = signup.body.token;
    ownerId = signup.body.user.id;
    Database.getProfile(ownerId)!.role = 'admin'; // Simulate an existing legacy record.
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${passwordToken}`);
    expect(me.body.user.role).toBe('student');
    expect(me.body.profile.role).toBe('student');
    const profile = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${passwordToken}`);
    expect(profile.body.profile.role).toBe('student');
    expect((await request(app).get('/api/mentorship/applications').set('Authorization', `Bearer ${passwordToken}`)).status).toBe(403);
    expect((await request(app).get('/api/copilot/cache-stats').set('Authorization', `Bearer ${passwordToken}`)).status).toBe(403);
    const signin = await request(app).post('/api/auth/signin').send({ email: owner, password: 'LocalPass123!' });
    expect(signin.status).toBe(200);
    expect(signin.body.user.role).toBe('student');
    expect(signin.body.profile.role).toBe('student');
  });

  it('rejects unverified or non-Google owner tokens', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'owner-firebase', email: owner, email_verified: false, firebase: { sign_in_provider: 'google.com' } });
    const unverified = await request(app).post('/api/auth/google').send({ email: owner, idToken: 'unverified', intent: 'auto' });
    expect(unverified.status).toBe(401);
    verifyIdToken.mockResolvedValueOnce({ uid: 'owner-firebase', email: owner, email_verified: true, firebase: { sign_in_provider: 'password' } });
    const wrongProvider = await request(app).post('/api/auth/google').send({ email: owner, idToken: 'wrong-provider', intent: 'auto' });
    expect(wrongProvider.status).toBe(401);
  });

  it('does not grant admin to an unverified direct Firebase token', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'firebase-owner', email: owner, email_verified: false, exp: Math.floor(Date.now() / 1000) + 300, firebase: { sign_in_provider: 'password' } });
    const result = await request(app).get('/api/mentorship/applications').set('Authorization', 'Bearer firebase-unverified-token');
    expect(result.status).toBe(403);
    verifyIdToken.mockReset();
  });

  it('checks Firebase revocation before accepting a direct owner token', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-owner', email: owner, email_verified: true, exp: Math.floor(Date.now() / 1000) + 300, firebase: { sign_in_provider: 'google.com' } });
    verifyIdToken.mockRejectedValueOnce(new Error('revoked'));
    const result = await request(app).get('/api/mentorship/applications').set('Authorization', 'Bearer revoked-owner-token');
    expect(result.status).toBe(401);
    expect(verifyIdToken).toHaveBeenLastCalledWith('revoked-owner-token', true);
  });

  it('grants owner access only to the separately verified Google session', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'owner-firebase', email: owner, email_verified: true, firebase: { sign_in_provider: 'google.com' } });
    const login = await request(app).post('/api/auth/google').send({ email: owner, idToken: 'verified-owner-token', intent: 'auto' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('admin');
    const auth = `Bearer ${login.body.token}`;
    expect((await request(app).get('/api/auth/me').set('Authorization', auth)).body.profile.role).toBe('admin');
    expect((await request(app).get('/api/user/profile').set('Authorization', auth)).body.profile.role).toBe('admin');
    expect((await request(app).get('/api/mentorship/applications').set('Authorization', auth)).status).toBe(200);
    expect((await request(app).get('/api/copilot/cache-stats').set('Authorization', auth)).status).toBe(200);
    // The Google login must never elevate an existing password session.
    expect((await request(app).get('/api/mentorship/applications').set('Authorization', `Bearer ${passwordToken}`)).status).toBe(403);
    await request(app).post('/api/auth/signout').set('Authorization', auth);
    expect((await request(app).get('/api/mentorship/applications').set('Authorization', auth)).status).toBe(401);
    // Existing password sessions remain signed in, but unprivileged.
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${passwordToken}`)).status).toBe(200);
  });
});
