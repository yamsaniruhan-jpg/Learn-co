import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

describe('session token SHA-256 hashing and startup purge', () => {
  it('stores only SHA-256 hashes in the data file so no usable raw token is ever written to disk', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-token-hash-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, LEARNCO_JSON_FALLBACK: 'true', FIREBASE_ADMIN_DISABLED: 'true' };

    const out = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `
        import { Database, flushDb } from './server/db.ts';
        const { user, token: signupToken } = Database.createUser({
          email: 'hashcheck@example.org',
          password: 'ValidPassword1',
          fullName: 'Hash Check',
          authProvider: 'email',
        });
        const secondToken = Database.createSession(user.id);
        await flushDb();
        const revoked = Database.createSession(user.id);
        await flushDb();
        Database.revokeSession(revoked);
        await flushDb();
        console.log(JSON.stringify({
          signupToken,
          secondToken,
          revoked,
          validSignup: !!Database.getSessionUser(signupToken),
          validSecond: !!Database.getSessionUser(secondToken),
          validRevoked: !!Database.getSessionUser(revoked),
        }));
      `,
      ],
      { cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000 }
    );

    expect(out.status, out.stderr).toBe(0);
    const { signupToken, secondToken, revoked, validSignup, validSecond, validRevoked } = JSON.parse(out.stdout.trim());

    expect(validSignup).toBe(true);
    expect(validSecond).toBe(true);
    expect(validRevoked).toBe(false);

    const diskContents = readFileSync(file, 'utf8');
    // Raw tokens must NEVER appear anywhere in the persisted JSON file
    expect(diskContents).not.toContain(signupToken);
    expect(diskContents).not.toContain(secondToken);
    expect(diskContents).not.toContain(revoked);

    const parsed = JSON.parse(diskContents);
    const signupHash = crypto.createHash('sha256').update(signupToken).digest('hex');
    const secondHash = crypto.createHash('sha256').update(secondToken).digest('hex');
    const revokedHash = crypto.createHash('sha256').update(revoked).digest('hex');

    expect(parsed.sessions[signupHash]).toBeDefined();
    expect(parsed.sessions[secondHash]).toBeDefined();
    expect(parsed.sessions[revokedHash]).toBeUndefined();

    // Even if an attacker steals a session key (the SHA-256 digest) from the JSON file,
    // presenting it as a bearer token must NOT authenticate!
    const probe = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `
        import { Database } from './server/db.ts';
        const userFromDigest = Database.getSessionUser(${JSON.stringify(signupHash)});
        const userFromRaw = Database.getSessionUser(${JSON.stringify(signupToken)});
        console.log(JSON.stringify({ digestAccepted: !!userFromDigest, rawAccepted: !!userFromRaw }));
      `,
      ],
      { cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000 }
    );

    expect(probe.status, probe.stderr).toBe(0);
    expect(JSON.parse(probe.stdout.trim())).toEqual({ digestAccepted: false, rawAccepted: true });
  });

  it('deletes all pre-upgrade unhashed sessions on startup so exposed legacy tokens are logged out once', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-legacy-purge-')), 'db.json');
    const legacyToken = 'exposed-raw-legacy-token-123456';
    writeFileSync(
      file,
      JSON.stringify({
        users: {
          'user-1': {
            id: 'user-1',
            email: 'legacy@example.org',
            authProvider: 'email',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
        usersByEmail: { 'legacy@example.org': 'user-1' },
        sessions: {
          [legacyToken]: {
            userId: 'user-1',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          },
        },
      }),
      'utf8'
    );

    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, LEARNCO_JSON_FALLBACK: 'true', FIREBASE_ADMIN_DISABLED: 'true' };
    const out = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `
        import { Database } from './server/db.ts';
        console.log(JSON.stringify({
          userFromLegacy: !!Database.getSessionUser(${JSON.stringify(legacyToken)}),
          sessionCount: Object.keys(Database.getDb().sessions).length,
        }));
      `,
      ],
      { cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000 }
    );

    expect(out.status, out.stderr).toBe(0);
    expect(JSON.parse(out.stdout.trim())).toEqual({ userFromLegacy: false, sessionCount: 0 });
    expect(readFileSync(file, 'utf8')).not.toContain(legacyToken);
  });
});
