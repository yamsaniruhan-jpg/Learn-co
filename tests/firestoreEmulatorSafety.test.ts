import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

describe('Firestore emulator safety guard', () => {
  for (const host of ['', 'localhost:8080', 'example.com:8080', '127.0.0.1:0', '127.0.0.1:65536']) {
    it(`refuses a non-approved emulator endpoint ${host || '(unset)'}`, () => {
      const result = spawnSync(process.execPath, ['--test', 'tests/firestoreRules.emulator.mjs'], {
        cwd: process.cwd(), env: { ...process.env, FIRESTORE_EMULATOR_HOST: host }, encoding: 'utf8', timeout: 10_000,
      });
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('Cloud hosts are not supported');
    });
  }
});
