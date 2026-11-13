import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock('../server/services/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken },
  adminDb: null,
}));
import authRoutes from '../server/routes/authRoutes';

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
});
