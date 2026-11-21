import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
const previous = process.env.CORS_ALLOWED_ORIGINS;
beforeAll(async () => {
  process.env.CORS_ALLOWED_ORIGINS = 'https://staging.example.test';
  app = await (await import('../server')).createApp();
});
afterAll(() => {
  if (previous === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
  else process.env.CORS_ALLOWED_ORIGINS = previous;
});

describe('cross-origin policy', () => {
  it.each(['https://learn-co.ai.studio', 'https://staging.example.test'])('allows an explicitly configured origin: %s', async origin => {
    const response = await request(app).options('/api/auth/signin').set('Origin', origin).set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'content-type,authorization');
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
  it.each(['https://attacker.example', 'https://learn-co.ai.studio.attacker.example', 'https://attacker.run.app', 'null'])('does not grant untrusted origin %s', async origin => {
    const response = await request(app).get('/api/health').set('Origin', origin);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    const preflight = await request(app).options('/api/auth/signin').set('Origin', origin).set('Access-Control-Request-Method', 'POST');
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('keeps origin-free requests functional', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
  });
});
