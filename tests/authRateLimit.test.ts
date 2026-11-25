import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('sign-in rate limiting', () => {
  it('throttles repeated production password attempts', () => {
    const script = `
      import { createApp } from './server.ts';
      import request from 'supertest';
      const app = await createApp();
      let response;
      for (let i = 0; i < 31; i++) {
        response = await request(app).post('/api/auth/signin').send({email:'absent@example.test',password:'bad-password'});
      }
      console.log(JSON.stringify({status: response.status, message: response.body.error}));
    `;
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30_000,
      env: { ...process.env, NODE_ENV: 'production', FIREBASE_ADMIN_DISABLED: 'true',
        LEARNCO_DB_FILE: join(mkdtempSync(join(tmpdir(), 'learnco-rate-limit-')), 'db.json') },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout.trim().split('\n').at(-1)!)).toEqual({
      status: 429, message: 'Too many sign-in attempts. Please try again later.',
    });
  }, 30_000);

  it('throttles forgot-password after 5 requests per hour per email and per IP in production', () => {
    const script = `
      import { createApp } from './server.ts';
      import request from 'supertest';
      const app = await createApp();

      // 1. Per-email throttle (max 5/hour across distinct IPs)
      const emailStatuses = [];
      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post('/api/auth/forgot-password')
          .set('X-Forwarded-For', \`198.51.100.\${i + 1}\`)
          .send({ email: 'target-user@example.test' });
        emailStatuses.push(res.status);
      }

      // 2. Per-IP throttle across rotating addresses (limit 15/hour)
      const ipStatuses = [];
      for (let i = 0; i < 16; i++) {
        const res = await request(app)
          .post('/api/auth/forgot-password')
          .set('X-Forwarded-For', '203.0.113.77')
          .send({ email: \`spray-\${i}@example.test\` });
        ipStatuses.push(res.status);
      }

      console.log(JSON.stringify({ emailStatuses, ipLastStatus: ipStatuses.at(-1) }));
    `;
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30_000,
      env: { ...process.env, NODE_ENV: 'production', FIREBASE_ADMIN_DISABLED: 'true',
        LEARNCO_DB_FILE: join(mkdtempSync(join(tmpdir(), 'learnco-reset-limit-')), 'db.json') },
    });
    expect(result.status, result.stderr).toBe(0);
    const parsed = JSON.parse(result.stdout.trim().split('\n').at(-1)!);
    expect(parsed.emailStatuses.slice(0, 5).every((s: number) => s !== 429)).toBe(true);
    expect(parsed.emailStatuses[5]).toBe(429);
    expect(parsed.ipLastStatus).toBe(429);
  }, 30_000);
});
