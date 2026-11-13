import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('database persistence across process restarts', () => {
  it('restores a user, source, and XP ledger from the configured data file', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-persist-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, FIREBASE_ADMIN_DISABLED: 'true' };
    function run(script: string) {
      const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000,
      });
      expect(result.status, result.stderr).toBe(0);
      return result.stdout;
    }
    const sessionOutput = run(`
      import { Database, flushDb } from './server/db.ts';
      const {user} = Database.createUser({email:'restart@example.org', password:'ValidPass123', fullName:'Restart', authProvider:'email'});
      Database.createSource(user.id, {title:'Saved', sourceType:'text', originalContent:'saved text', extractedText:'saved text'});
      Database.updateUserXp(user.id, 50);
      const active = Database.createSession(user.id);
      const revoked = Database.createSession(user.id);
      await flushDb();
      Database.revokeSession(revoked);
      await flushDb();
      console.log(JSON.stringify({ active, revoked }));
    `);
    const { active, revoked } = JSON.parse(sessionOutput.trim());
    const output = run(`
      import { Database } from './server/db.ts';
      const user = Database.findUserByEmail('restart@example.org');
      console.log(JSON.stringify({xp:Database.getGamification(user.id).xp, sources:Database.getSources(user.id).length, history:Database.getUserXpTransactions(user.id).length, active:!!Database.getSessionUser(${JSON.stringify(active)}), revoked:!!Database.getSessionUser(${JSON.stringify(revoked)})}));
    `);
    expect(JSON.parse(output.trim())).toEqual({ xp: 50, sources: 1, history: 1, active: true, revoked: false });
  });
});
