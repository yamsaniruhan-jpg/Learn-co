import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';

let app: Express, token: string, userId: string;
beforeAll(async () => {
  app = await (await import('../server')).createApp();
  const response = await request(app).post('/api/auth/signup').send({ email: `authority-${Date.now()}@example.test`, password: 'Password123', fullName: 'Authority Test' });
  expect(response.status).toBe(201); token = response.body.token; userId = response.body.user.id;
}, 60_000);
const auth = () => ({ Authorization: `Bearer ${token}` });
const question = MASTER_QUESTION_BANK.find(q => typeof q.correctAnswer === 'string')!;
const submit = (id: string) => request(app).post('/api/practice/submit-attempt').set(auth()).send({
  attemptId: id, questionId: question.id, subjectId: question.subjectId,
  selectedAnswer: question.correctAnswer, correctAnswer: 'forged', isCorrect: true,
});

describe('server XP authority', () => {
  it('does not expose email-based legacy avatar URLs on the public leaderboard', async () => {
    const update = await request(app).put('/api/user/profile').set(auth()).send({ avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice%40example.test' });
    expect(update.status).toBe(200);
    const board = await request(app).get('/api/leaderboard');
    const entry = board.body.leaderboard.find((item: any) => item.userId === userId);
    expect(entry).toBeTruthy();
    expect(entry.avatarUrl).toBe('');
  });
  it('rejects repeated attempts to push client-selected XP totals', async () => {
    for (let i = 1; i <= 3; i++) {
      const response = await request(app).post('/api/leaderboard/xp').set(auth()).send({xp: i * 50});
      expect(response.status).toBe(403); expect(response.body.code).toBe('CLIENT_XP_NOT_ACCEPTED');
    }
    const profile = await request(app).get('/api/user/profile').set(auth());
    expect(profile.body.gamification.xp).toBe(0);
  });
  it('awards bank XP only once per question and day even across concurrent distinct attempts', async () => {
    const [a, b] = await Promise.all([submit('authority-bank-a'), submit('authority-bank-b')]);
    expect(a.status).toBe(200); expect(b.status).toBe(200);
    expect([a.body.xpEarned, b.body.xpEarned].sort()).toEqual([0, 5]);
    expect(a.body.verification).toBe('bank'); expect(b.body.verification).toBe('bank');
    const retry = await submit('authority-bank-a');
    expect(retry.body.xpEarned).toBe(0);
    const profile = await request(app).get('/api/user/profile').set(auth());
    expect(profile.body.gamification.xp).toBe(5);
  });
  it('keeps custom practice usable but unverified and unable to earn server XP', async () => {
    const res = await request(app).post('/api/practice/submit-attempt').set(auth()).send({
      attemptId: 'authority-custom', questionId: 'custom-forged', subjectId: 'math',
      selectedAnswer: 'answer', correctAnswer: 'answer', isCorrect: true,
    });
    expect(res.status).toBe(200); expect(res.body.isCorrect).toBe(true);
    expect(res.body.verification).toBe('unverified'); expect(res.body.xpEarned).toBe(0);
  });
  it('gives no fabricated subject score and computes period scores from ledger entries', async () => {
    const daily = await request(app).get('/api/leaderboard?timeframe=daily').set(auth());
    const filtered = await request(app).get('/api/leaderboard?timeframe=weekly&subject=chemistry').set(auth());
    expect(daily.status).toBe(200); expect(daily.body.leaderboard.find((entry: any) => entry.userId === userId).xp).toBe(5);
    expect(filtered.body.leaderboard.find((entry: any) => entry.userId === userId).xp).toBe(question.subjectId === 'chemistry' ? 5 : 0);
  });
});
