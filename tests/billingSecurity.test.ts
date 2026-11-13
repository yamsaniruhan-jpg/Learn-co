import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function run(script: string) {
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    FIREBASE_ADMIN_DISABLED: 'true',
    LEARNCO_DB_FILE: join(mkdtempSync(join(tmpdir(), 'learnco-billing-')), 'db.json'),
    STRIPE_SECRET_KEY: 'sk_test_local_only',
    STRIPE_WEBHOOK_SECRET: 'whsec_local_only',
  };
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
    cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000,
  });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout;
}

describe('production billing safeguards', () => {
  it('does not grant a sandbox upgrade when Stripe checkout fails', () => {
    const output = run(`
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const stripePath = require.resolve('stripe');
      require.cache[stripePath] = { id: stripePath, filename: stripePath, loaded: true, exports: class {
        constructor() { this.checkout = { sessions: { create: async () => { throw new Error('simulated outage'); } } }; }
      }};
      const express = require('express');
      const request = require('supertest');
      const { setSessionResolver } = require('./middleware/auth.js');
      setSessionResolver(() => ({ id: 'student', email: 'student@example.org', subscription: 'free' }));
      const app = express(); app.use(express.json());
      app.use('/api/subscription', require('./routes/subscription.js'));
      const response = await request(app).post('/api/subscription/checkout')
        .set('Authorization', 'Bearer local-token').send({tier:'pro'});
      console.log(JSON.stringify({status:response.status, code:response.body.code, mode:response.body.mode}));
    `);
    const result = JSON.parse(output.trim().split('\n').at(-1)!);
    expect(result).toEqual({ status: 503, code: 'BILLING_UNAVAILABLE' });
  });

  it('verifies a signed webhook using the original request bytes', () => {
    const output = run(`
      import { createApp } from './server.ts';
      import Stripe from 'stripe';
      import request from 'supertest';
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const payload = JSON.stringify({id:'evt_local', type:'test.unhandled', data:{object:{}}}, null, 2);
      const sig = stripe.webhooks.generateTestHeaderString({payload, secret:process.env.STRIPE_WEBHOOK_SECRET});
      const app = await createApp();
      const valid = await request(app).post('/api/subscription/webhook').set('Content-Type','application/json').set('stripe-signature',sig).send(payload);
      const invalid = await request(app).post('/api/subscription/webhook').set('Content-Type','application/json').set('stripe-signature',sig).send(payload + ' ');
      console.log(JSON.stringify({valid:valid.status, invalid:invalid.status}));
    `);
    expect(JSON.parse(output.trim().split('\n').at(-1)!)).toEqual({ valid: 200, invalid: 400 });
  });
});
