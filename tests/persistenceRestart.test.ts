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
      Database.updateProfile(user.id, { displayName: 'Persisted name', bio: 'Persisted bio' });
      Database.updateSettings(user.id, { theme: 'dark' });
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
      console.log(JSON.stringify({xp:Database.getGamification(user.id).xp, sources:Database.getSources(user.id).length, history:Database.getUserXpTransactions(user.id).length, active:!!Database.getSessionUser(${JSON.stringify(active)}), revoked:!!Database.getSessionUser(${JSON.stringify(revoked)}), displayName: Database.getProfile(user.id).displayName, bio: Database.getProfile(user.id).bio, theme: Database.getSettings(user.id).theme}));
    `);
    expect(JSON.parse(output.trim())).toEqual({ xp: 50, sources: 1, history: 1, active: true, revoked: false, displayName: 'Persisted name', bio: 'Persisted bio', theme: 'dark' });
  });

  it('persists verified-session provenance across restarts without promoting legacy sessions', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-persist-owner-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, FIREBASE_ADMIN_DISABLED: 'true' };
    const run = (script: string) => {
      const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000,
      });
      expect(result.status, result.stderr).toBe(0);
      return result.stdout.trim();
    };
    const tokens = JSON.parse(run(`import { Database, flushDb } from './server/db.ts';
      const {user, token} = Database.createUser({email:'owner@example.org', password:'ValidPass123', fullName:'Owner', authProvider:'email'});
      const verified = Database.createSession(user.id, true); await flushDb();
      console.log(JSON.stringify({legacy: token, verified}));`));
    expect(JSON.parse(run(`import { Database } from './server/db.ts';
      console.log(JSON.stringify({legacy: Database.isVerifiedOwnerSession(${JSON.stringify(tokens.legacy)}), verified: Database.isVerifiedOwnerSession(${JSON.stringify(tokens.verified)})}));`)))
      .toEqual({ legacy: false, verified: true });
  });

  it('persists profile and settings changes without another database write', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-persist-settings-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, FIREBASE_ADMIN_DISABLED: 'true' };
    const run = (script: string) => {
      const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000,
      });
      expect(result.status, result.stderr).toBe(0);
      return result.stdout.trim();
    };
    run(`import { Database, flushDb } from './server/db.ts';
      Database.createUser({email:'settings@example.org', password:'ValidPass123', fullName:'Before', authProvider:'email'});
      await flushDb();`);
    run(`import { Database, flushDb } from './server/db.ts';
      const user = Database.findUserByEmail('settings@example.org');
      Database.updateProfile(user.id, { displayName: 'After' });
      await flushDb();`);
    expect(run(`import { Database } from './server/db.ts';
      const user = Database.findUserByEmail('settings@example.org');
      console.log(Database.getProfile(user.id).displayName);`)).toBe('After');
    run(`import { Database, flushDb } from './server/db.ts';
      const user = Database.findUserByEmail('settings@example.org');
      Database.updateSettings(user.id, { theme: 'dark' });
      await flushDb();`);
    expect(JSON.parse(run(`import { Database } from './server/db.ts';
      const user = Database.findUserByEmail('settings@example.org');
      console.log(JSON.stringify({name: Database.getProfile(user.id).displayName, theme: Database.getSettings(user.id).theme}));`)))
      .toEqual({ name: 'After', theme: 'dark' });
  });

  it('persists practice attempts and mentorship state across restarts', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-persist-mentorship-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, LEARNCO_JSON_FALLBACK: 'true', FIREBASE_ADMIN_DISABLED: 'true' };
    const run = (script: string) => {
      const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: process.cwd(), env, encoding: 'utf8', timeout: 30_000,
      });
      expect(result.status, result.stderr).toBe(0);
      return result.stdout.trim();
    };

    const ids = JSON.parse(run(`
      import { Database, flushDb } from './server/db.ts';
      import { XpEngine } from './server/xpEngine.ts';
      const { user: student } = Database.createUser({ email: 'student-persist@example.org', password: 'ValidPass123', fullName: 'Student One', authProvider: 'email' });
      const { user: mentorUser } = Database.createUser({ email: 'mentor-persist@example.org', password: 'ValidPass123', fullName: 'Mentor One', authProvider: 'email' });
      const mentor = Database.createOrUpdateMentorProfile(mentorUser.id, { headline: 'Physics Olympiad Coach', subjects: ['physics'] });
      const reqRes = Database.createMentorshipRequest(student.id, {
        mentorId: mentor.id,
        subjectId: 'physics',
        goalDescription: 'Master Lagrangian Mechanics',
        initialMessage: 'Looking forward to weekly sessions',
      });
      const dec = Database.respondMentorshipRequest(mentorUser.id, reqRes.request.id, 'ACCEPT', 'Welcome!');
      const attempt = await XpEngine.submitAttempt(student.id, {
        attemptId: 'att-persist-1',
        questionId: 'q-custom-persist',
        subjectId: 'physics',
        topicId: 'Mechanics',
        difficulty: 'medium',
        questionText: 'Work done by conservative force in closed loop?',
        selectedAnswer: '0',
        correctAnswer: '0',
        explanation: 'Closed path integral of conservative force is zero.',
        solvingTimeSeconds: 20,
        hintsRevealedCount: 0,
      });
      await flushDb();
      console.log(JSON.stringify({ studentId: student.id, mentorUserId: mentorUser.id, relId: dec.relationship?.id, attemptOk: attempt.isCorrect }));
    `));

    expect(ids.attemptOk).toBe(true);
    expect(ids.relId).toBeTruthy();

    const restored = JSON.parse(run(`
      import { Database } from './server/db.ts';
      const attempts = Database.getUserAttempts(${JSON.stringify(ids.studentId)});
      const rels = Database.listMentorshipRelationships(${JSON.stringify(ids.studentId)});
      const msgs = Database.listMentorshipMessages(${JSON.stringify(ids.studentId)}, ${JSON.stringify(ids.relId)});
      console.log(JSON.stringify({
        attemptCount: attempts.length,
        relCount: rels.length,
        relStatus: rels[0]?.status,
        msgCount: msgs.length,
      }));
    `));

    expect(restored).toEqual({
      attemptCount: 1,
      relCount: 1,
      relStatus: 'ACTIVE',
      msgCount: 1,
    });
  });
});
