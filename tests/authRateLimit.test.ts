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
});
