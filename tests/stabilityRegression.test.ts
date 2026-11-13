import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from '../server/db';

let app: Express;
let token: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const { createApp } = await import('../server.js');
  app = await createApp();
  const response = await request(app).post('/api/auth/signup').send({
    email: `stability-${Date.now()}@example.org`, password: 'ValidPass123', fullName: 'Stability Test',
  });
  expect(response.status).toBe(201);
  token = response.body.token;
}, 60_000);

describe('startup and data regression safeguards', () => {
  it('rejects fabricated Google identity tokens instead of granting a session', async () => {
    const response = await request(app).post('/api/auth/google').send({
      email: 'victim@example.org', idToken: 'header.payload.mock_sig_fake', intent: 'auto',
    });
    expect([401, 503]).toContain(response.status);
    expect(response.body.token).toBeUndefined();
  });

  it('rejects malformed source input without consuming quota or crashing', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const before = await request(app).get('/api/creator/quota').set(headers);
    const malformed = await request(app).post('/api/creator/sources').set(headers)
      .send({ sourceType: 'text', content: { not: 'text' } });
    const empty = await request(app).post('/api/creator/sources').set(headers)
      .send({ sourceType: 'text', content: '   ' });
    const badPdf = await request(app).post('/api/creator/sources').set(headers)
      .send({ sourceType: 'pdf', fileBase64: 'data:application/pdf;base64,YmFk' });
    const after = await request(app).get('/api/creator/quota').set(headers);
    expect(malformed.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(badPdf.status).toBe(415);
    expect(after.body.quotas.sources.used).toBe(before.body.quotas.sources.used);
  });

  it('accepts both historical scrypt encodings without downgrading verification', () => {
    const password = 'ValidPass123';
    const salt = crypto.randomBytes(16);
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    const previous = `scrypt$${salt.toString('hex')}$${derived}`;
    expect(verifyPassword(password, previous).valid).toBe(true);
    expect(verifyPassword('incorrect', previous).valid).toBe(false);
    expect(verifyPassword(password, hashPassword(password)).valid).toBe(true);
  });
});
