import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

function inspect(raw: string) {
  const script = `
    const Module = require('module');
    const original = Module._load;
    const calls = {cert: 0, adc: 0, init: 0};
    Module._load = function(id, ...args) {
      if (id === 'firebase-admin/app') return {
        getApps: () => [], getApp: () => null,
        cert: account => { calls.cert++; return {account}; },
        applicationDefault: () => { calls.adc++; return {}; },
        initializeApp: () => { calls.init++; return {}; },
      };
      if (id === 'firebase-admin/firestore') return { getFirestore: () => ({}), FieldValue: {}, Timestamp: {} };
      if (id === 'firebase-admin/auth') return { getAuth: () => ({}) };
      return original.call(this, id, ...args);
    };
    process.env.FIREBASE_ADMIN_DISABLED = 'false';
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = ${JSON.stringify(raw)};
    console.warn = () => {};
    require('./server/services/firebaseAdminCompat.cjs');
    console.log(JSON.stringify(calls));
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: process.cwd(), encoding: 'utf8', timeout: 10_000 });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout.trim());
}
describe('legacy Firebase Admin credential configuration', () => {
  it('uses an explicit account instead of unrelated default credentials', () => {
    expect(inspect('{"project_id":"fake"}')).toEqual({ cert: 1, adc: 0, init: 1 });
  });
  it('does not fall back to default credentials for malformed account data', () => {
    expect(inspect('{invalid')).toEqual({ cert: 0, adc: 0, init: 0 });
  });
});
