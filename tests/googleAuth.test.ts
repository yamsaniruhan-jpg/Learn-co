import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock('../server/services/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken },
  adminDb: null,
}));
import authRoutes from '../server/routes/authRoutes';
import { Database } from '../server/db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Google identity verification', () => {
  it('never accepts a fabricated token even when Firebase is configured', async () => {
    verifyIdToken.mockClear();
    const response = await request(app).post('/api/auth/google').send({
      email: 'victim@example.org', idToken: 'fake.mock_sig_test', intent: 'auto',
    });
    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects a token for a different or unverified email', async () => {
    verifyIdToken.mockResolvedValueOnce({
      email: 'other@example.org', email_verified: true, firebase: { sign_in_provider: 'google.com' },
    });
    const response = await request(app).post('/api/auth/google').send({
      email: 'victim@example.org', idToken: 'real-token-shape', intent: 'auto',
    });
    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
  });

  it('creates a session only after a verified Google token', async () => {
    const email = `verified-${Date.now()}@example.org`;
    verifyIdToken.mockResolvedValueOnce({ email, email_verified: true, firebase: { sign_in_provider: 'google.com' } });
    const response = await request(app).post('/api/auth/google').send({ email, idToken: 'verified-token', intent: 'auto' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(verifyIdToken).toHaveBeenCalledWith('verified-token', true);
  });

  it('prevents passwordless Google accounts from being hijacked via password signin, signup, or reset', async () => {
    const email = `google-only-${Date.now()}@example.org`;
    verifyIdToken.mockResolvedValueOnce({ email, email_verified: true, firebase: { sign_in_provider: 'google.com' } });
    const googleRes = await request(app).post('/api/auth/google').send({ email, idToken: 'verified-token', intent: 'auto' });
    expect(googleRes.status).toBe(200);

    const signinAttempt = await request(app).post('/api/auth/signin').send({ email, password: 'AttackerPassword123!' });
    expect(signinAttempt.status).toBe(401);
    // Do not reveal the account's authentication provider to an unauthenticated caller.
    expect(signinAttempt.body.googleOnly).toBeUndefined();
    expect(signinAttempt.body.token).toBeUndefined();

    const signupAttempt = await request(app).post('/api/auth/signup').send({ email, password: 'AttackerPassword123!', fullName: 'Attacker' });
    expect(signupAttempt.status).toBe(400);
    expect(signupAttempt.body.token).toBeUndefined();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const resetRes = await request(app).post('/api/auth/forgot-password').send({ email });
      // Without a mail provider the reset endpoint fails uniformly rather than
      // issuing a link that cannot be delivered.
      expect(resetRes.status).toBe(503);
      const leakedReset = warnSpy.mock.calls.map((c) => c.join(' ')).some((line) => line.includes(email) && line.includes('reset_token='));
      expect(leakedReset).toBe(false);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('links firebaseUid cleanly when an existing email account signs in with Google', async () => {
    const email = `link-uid-${Date.now()}@example.org`;
    const signup = await request(app).post('/api/auth/signup').send({
      email,
      password: 'StrongPassword123!',
      fullName: 'Existing Student',
    });
    expect(signup.status).toBe(201);

    verifyIdToken.mockResolvedValueOnce({
      uid: 'google-uid-12345',
      email,
      email_verified: true,
      name: 'Google Student',
      picture: 'https://example.org/avatar.png',
      firebase: { sign_in_provider: 'google.com' },
    });

    const googleRes = await request(app).post('/api/auth/google').send({
      email,
      idToken: 'verified-google-token',
      intent: 'signin',
    });
    expect(googleRes.status).toBe(200);
    expect(googleRes.body.token).toBeTruthy();
    expect(googleRes.body.user.email).toBe(email);
    expect(googleRes.body.profile?.avatarUrl).toBe('https://example.org/avatar.png');
    expect(Database.findUserByEmail(email)?.firebaseUid).toBe('google-uid-12345');
  });
});
