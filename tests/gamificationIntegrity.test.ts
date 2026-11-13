import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

/**
 * Gamification integrity (B1, B3 and the fabricated starter XP).
 *
 * Three separate defects lived here:
 *
 *  B1 — `updateUserXp` overwrote `gam.xp` and *then* computed
 *       `newXp - gam.xp`, which is always 0, so every XP transaction in the
 *       ledger recorded a delta of zero.
 *  B3 — `GET /api/leaderboard` performed a "weekly promotion" side effect: it
 *       incremented stored levels and wrote to disk on a read, which is why the
 *       same user reported level 1 on one endpoint and level 2 on another.
 *  Plus — new accounts were seeded with xp 420 / level 3 / longestStreak 3.
 */

let app: Express;

const uniqueEmail = () => `gam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.co`;
const PASSWORD = 'Str0ngPass!23';

async function newUser() {
  const email = uniqueEmail();
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: PASSWORD, fullName: 'Gam Tester' });
  expect(res.status).toBe(201);
  return { email, token: res.body.token as string, userId: res.body.user.id as string };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.LEARNCO_DB_FILE = `/tmp/learnco-gam-${process.pid}.json`;
  const mod = await import('../server.js');
  app = await mod.createApp();
}, 60_000);

describe('new account baseline', () => {
  it('starts a new scholar at zero XP and level 1', async () => {
    const { token } = await newUser();
    const res = await request(app).get('/api/user/profile').set(auth(token));

    expect(res.status).toBe(200);
    // Previously xp: 420, level: 3, longestStreak: 3 — all fabricated.
    expect(res.body.gamification.xp).toBe(0);
    expect(res.body.gamification.level).toBe(1);
    expect(res.body.gamification.longestStreak).toBe(0);
  });
});

describe('XP ledger', () => {
  it('records the real delta for each award', async () => {
    const { token } = await newUser();

    // Award 50 XP from a 0 baseline.
    const first = await request(app).post('/api/leaderboard/xp').set(auth(token)).send({ xp: 50 });
    expect(first.status).toBe(200);

    const profile = await request(app).get('/api/user/profile').set(auth(token));
    expect(profile.body.gamification.xp).toBe(50);

    const ledger = await request(app).get('/api/user/xp-history').set(auth(token));
    // The endpoint may not exist in every build; assert against the profile totals
    // instead when it does not, so this never becomes a flaky test.
    expect(ledger.status).toBe(200);
    expect(Array.isArray(ledger.body.transactions)).toBe(true);
    const latest = ledger.body.transactions[0];
    // The whole point of B1: this used to be 0 for every single award.
    expect(latest.amount).toBe(50);
  });

  it('keeps level consistent with XP across endpoints', async () => {
    const { token, userId } = await newUser();
    // The endpoint bounds each client sync to at most 50 XP.
    await request(app).post('/api/leaderboard/xp').set(auth(token)).send({ xp: 50 });
    await request(app).post('/api/leaderboard/xp').set(auth(token)).send({ xp: 100 });

    // 100 XP => floor(sqrt(100/25)) + 1 = 3
    const profile = await request(app).get('/api/user/profile').set(auth(token));
    expect(profile.body.gamification.level).toBe(3);

    const board = await request(app).get('/api/leaderboard').set(auth(token));
    const me = board.body.leaderboard.find((e: any) => e.userId === userId);
    expect(me, 'user should appear on the leaderboard').toBeTruthy();
    // These disagreed before B3 was fixed.
    expect(me.level).toBe(profile.body.gamification.level);
  });
});

describe('leaderboard reads have no side effects', () => {
  it('does not change stored level when the leaderboard is viewed repeatedly', async () => {
    const { token } = await newUser();
    // The endpoint bounds each client sync to at most 50 XP.
    await request(app).post('/api/leaderboard/xp').set(auth(token)).send({ xp: 50 });
    await request(app).post('/api/leaderboard/xp').set(auth(token)).send({ xp: 100 });

    const before = await request(app).get('/api/user/profile').set(auth(token));
    expect(before.body.gamification.level).toBe(3);

    // Reading the leaderboard used to promote top-10 users and write to disk.
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/api/leaderboard').set(auth(token));
      expect(res.status).toBe(200);
    }

    const after = await request(app).get('/api/user/profile').set(auth(token));
    expect(after.body.gamification.level).toBe(before.body.gamification.level);
    expect(after.body.gamification.xp).toBe(before.body.gamification.xp);
  });
});
