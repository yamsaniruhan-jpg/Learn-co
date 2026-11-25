import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  cspNonceMiddleware,
  injectNonceIntoHtml,
  securityHeaders,
} from '../server/middleware/securityHeaders';
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  createCsrfProtection,
  setAuthSessionCookies,
  clearAuthSessionCookies,
} from '../server/middleware/csrf';
import { extractAuthToken } from '../server/middleware/authMiddleware';
import { compileSafeSolveFunction } from '../src/utils/safeJsRunner';

describe('CSP headers and nonce injection', () => {
  it('omits unsafe-inline and unsafe-eval from script-src and attaches per-request nonce', async () => {
    const app = express();
    app.use(cspNonceMiddleware);
    app.use(securityHeaders);
    app.get('/', (_req, res) => {
      const html = injectNonceIntoHtml(
        '<!doctype html><html><body><script type="module" src="/src/main.tsx"></script><script>window.__ok=1;</script></body></html>',
        res.locals.cspNonce
      );
      res.type('html').send(html);
    });

    const res1 = await request(app).get('/');
    const res2 = await request(app).get('/');

    const csp1 = res1.headers['content-security-policy'] || '';
    const csp2 = res2.headers['content-security-policy'] || '';
    const scriptDirective1 = csp1
      .split(';')
      .map((s: string) => s.trim())
      .find((s: string) => s.startsWith('script-src'));

    expect(scriptDirective1).toBeTruthy();
    expect(scriptDirective1).not.toContain("'unsafe-inline'");
    expect(scriptDirective1).not.toContain("'unsafe-eval'");
    expect(scriptDirective1).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);

    const directives = csp1.split(';').map((s: string) => s.trim());
    const connectDirective = directives.find((s: string) => s.startsWith('connect-src')) || '';
    const imgDirective = directives.find((s: string) => s.startsWith('img-src')) || '';
    const mediaDirective = directives.find((s: string) => s.startsWith('media-src')) || '';

    expect(connectDirective).not.toMatch(/\bws:(?:\s|$)/);
    expect(connectDirective).not.toMatch(/\bwss:(?:\s|$)/);
    expect(connectDirective).not.toContain('https://*.googleapis.com');
    expect(connectDirective).toContain('wss://firestore.googleapis.com');
    expect(connectDirective).toContain('https://identitytoolkit.googleapis.com');

    expect(imgDirective).not.toMatch(/\bhttps:(?:\s|$)/);
    expect(imgDirective).toContain("'self'");
    expect(imgDirective).toContain('data:');
    expect(imgDirective).toContain('blob:');
    expect(imgDirective).toContain('https://lh3.googleusercontent.com');

    expect(mediaDirective).toContain("'self'");
    expect(mediaDirective).toContain('blob:');
    expect(mediaDirective).toContain('data:');

    const nonce1 = scriptDirective1!.match(/'nonce-([^']+)'/)?.[1];
    const nonce2 = csp2.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
    expect(res1.text).toContain(`<script nonce="${nonce1}" type="module"`);
    expect(res1.text).toContain(`<script nonce="${nonce1}">window.__ok=1;</script>`);
  });
});

describe('HttpOnly auth cookie & CSRF protection', () => {
  function buildApp() {
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    const allowedOrigins = new Set(['https://learn-co.ai.studio', 'http://localhost:3000']);
    app.use('/api', createCsrfProtection(allowedOrigins));

    app.post('/api/auth/signin', (req, res) => {
      setAuthSessionCookies(req, res, 'raw-session-token-123');
      res.json({ success: true, user: { id: 'u1' } });
    });
    app.post('/api/auth/signout', (req, res) => {
      clearAuthSessionCookies(req, res);
      res.json({ success: true });
    });
    app.post('/api/practice/submit-attempt', (req, res) => {
      res.json({ success: true, token: extractAuthToken(req) });
    });
    app.post('/api/subscription/webhook', (_req, res) => {
      res.json({ received: true });
    });
    return app;
  }

  it('sets HttpOnly, SameSite=Lax cookies (and Secure in production / over HTTPS) and extracts token from cookie', async () => {
    const app = buildApp();
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({});

      expect(res.status).toBe(200);
      const setCookies: string[] = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie']
        : [];
      const authCookie = setCookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
      const csrfCookie = setCookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));

      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
      expect(authCookie).toContain('SameSite=Lax');
      expect(authCookie).toContain('Secure');
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).toContain('SameSite=Lax');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it('blocks state-changing cookie requests without matching X-CSRF-Token or with foreign Origin', async () => {
    const app = buildApp();
    const csrfToken = '0123456789abcdef0123456789abcdef';

    const missingCsrf = await request(app)
      .post('/api/practice/submit-attempt')
      .set('Cookie', [`${AUTH_COOKIE_NAME}=tok-1`, `${CSRF_COOKIE_NAME}=${csrfToken}`])
      .send({});
    expect(missingCsrf.status).toBe(403);
    expect(missingCsrf.body.code).toBe('CSRF_INVALID');

    const crossSite = await request(app)
      .post('/api/practice/submit-attempt')
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Cookie', [`${AUTH_COOKIE_NAME}=tok-1`, `${CSRF_COOKIE_NAME}=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({});
    expect(crossSite.status).toBe(403);
    expect(crossSite.body.code).toBe('CSRF_CROSS_SITE');

    const badOrigin = await request(app)
      .post('/api/practice/submit-attempt')
      .set('Origin', 'https://evil.example.com')
      .set('Cookie', [`${AUTH_COOKIE_NAME}=tok-1`, `${CSRF_COOKIE_NAME}=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({});
    expect(badOrigin.status).toBe(403);
    expect(badOrigin.body.code).toBe('CSRF_ORIGIN_MISMATCH');

    const valid = await request(app)
      .post('/api/practice/submit-attempt')
      .set('Origin', 'https://learn-co.ai.studio')
      .set('Cookie', [`${AUTH_COOKIE_NAME}=tok-1`, `${CSRF_COOKIE_NAME}=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({});
    expect(valid.status).toBe(200);
    expect(valid.body.token).toBe('tok-1');

    // Webhook exemption still passes without CSRF cookie/header
    const webhook = await request(app)
      .post('/api/subscription/webhook')
      .set('Sec-Fetch-Site', 'cross-site')
      .send({});
    expect(webhook.status).toBe(200);
  });
});

describe('CSP-safe ICT coding sandbox interpreter', () => {
  const noopConsole = { log: () => {} };

  it('runs solve() algorithms without eval or Function constructor', () => {
    const solve = compileSafeSolveFunction(`
      function solve(input) {
        const nums = input.map((x) => x * 2);
        return nums.reduce((acc, v) => acc + v, 0);
      }
    `, noopConsole);
    expect(solve([1, 2, 3])).toBe(12);
  });

  it('blocks prototype traversal and infinite loops safely', () => {
    const protoAttempt = compileSafeSolveFunction(`
      function solve(x) { return x.__proto__; }
    `, noopConsole);
    expect(() => protoAttempt({})).toThrow(/blocked in sandbox/i);

    const infiniteLoop = compileSafeSolveFunction(`
      function solve() {
        while (true) {}
      }
    `, noopConsole, 2000);
    expect(() => infiniteLoop([])).toThrow(/step limit|execution limit/i);
  });
});

describe('JSON body limits (100kb global vs 10mb creator upload)', () => {
  it('rejects >100kb JSON payloads on standard routes while allowing >100kb on POST /api/creator/sources', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const { createApp } = await import('../server');
    const app = await createApp();
    try {
      const oversizePayload = 'x'.repeat(140 * 1024);

      const standardRes = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'test@example.test', password: oversizePayload });
      expect(standardRes.status).toBe(413);

      // Creator sources route allows up to 10mb (unauthenticated caller gets 401 after body parse, not 413)
      const creatorRes = await request(app)
        .post('/api/creator/sources')
        .send({ sourceType: 'text', content: oversizePayload });
      expect(creatorRes.status).toBe(401);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});

describe('Forgot-password per-email rate limiting & Study Rooms HTTP fallback', () => {
  it('rate-limits /api/auth/forgot-password after 5 requests per email in 1 hour', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const { createApp } = await import('../server');
    const app = await createApp();

    // Activate per-request limiters cleanly with a unique test email
    process.env.NODE_ENV = 'development';
    const testEmail = `ratelimit-${Date.now()}@example.test`;
    try {
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: testEmail });
        // 503 when SMTP/Resend unconfigured, or 200 if configured; must not leak account existence
        expect([200, 503]).toContain(res.status);
      }
      const blocked = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });
      expect(blocked.status).toBe(429);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('supports Study Rooms HTTP fallback for public rooms while blocking locked private rooms', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const { createApp } = await import('../server');
    const app = await createApp();
    try {
      const listRes = await request(app).get('/api/study-rooms');
      expect(listRes.status).toBe(200);
      const publicRoom = (listRes.body.rooms || []).find((r: any) => r.visibility === 'public');
      expect(publicRoom).toBeTruthy();

      const msgRes = await request(app)
        .post(`/api/study-rooms/${publicRoom.id}/messages`)
        .send({ peerId: 'peer-rest-1', displayName: 'Ada', text: 'Checking HTTP fallback' });
      expect(msgRes.status).toBe(201);
      expect(msgRes.body.message.text).toBe('Checking HTTP fallback');

      const privateCreate = await request(app)
        .post('/api/study-rooms')
        .send({
          title: 'Secret Lab',
          topic: 'Physics',
          visibility: 'private',
          roomCode: 'SEC-99',
          password: 'pass-word-123',
          peerId: 'host-1',
          hostName: 'Host',
        });
      expect(privateCreate.status).toBe(201);

      const unauthWrite = await request(app)
        .post(`/api/study-rooms/${privateCreate.body.room.id}/messages`)
        .send({ peerId: 'intruder', displayName: 'Intruder', text: 'Hello' });
      expect(unauthWrite.status).toBe(403);
      expect(unauthWrite.body.code).toBe('PRIVATE_ROOM_LOCKED');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});
