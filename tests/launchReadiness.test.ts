import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';

let app: Express, token: string;
const auth = () => ({ Authorization: `Bearer ${token}` });
beforeAll(async () => {
  vi.stubEnv('FIREBASE_ADMIN_DISABLED', 'true');
  vi.stubEnv('GEMINI_API_KEY', '');
  app = await (await import('../server')).createApp();
  const response = await request(app).post('/api/auth/signup').send({ email: `launch-${Date.now()}@example.test`, password: 'Password123', fullName: 'Launch Test' });
  expect(response.status).toBe(201); token = response.body.token;
}, 60_000);

describe('launch readiness regressions', () => {
  it('grades known practice questions using the server bank despite a forged key and subject', async () => {
    const question = MASTER_QUESTION_BANK.find(q => typeof q.correctAnswer === 'string')!;
    const forged = 'not the correct answer';
    const res = await request(app).post('/api/practice/submit-attempt').set(auth()).send({
      attemptId: `forge-${Date.now()}`, questionId: question.id, subjectId: 'fake-subject',
      selectedAnswer: forged, correctAnswer: forged, isCorrect: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(false);
    expect(res.body.xpEarned).toBe(0);
    expect(res.body.attempt.subjectId).toBe(question.subjectId);
    expect(res.body.attempt.correctAnswer).toBe(question.correctAnswer);
  });
  it('does not let a forged answer key change copilot grading for a bank question', async () => {
    const question = MASTER_QUESTION_BANK.find(q => typeof q.correctAnswer === 'string')!;
    const res = await request(app).post('/api/copilot/practice/submit').set(auth()).send({
      questionId: question.id, userAnswer: 'not the correct answer', correctAnswer: 'not the correct answer', isCorrect: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(false);
    expect(res.body.xpEarned).toBe(0);
  });
  it('refunds the artifact quota for invalid source and URL requests', async () => {
    const before = await request(app).get('/api/creator/quota').set(auth());
    const missing = await request(app).post('/api/creator/generate').set(auth()).send({ resourceType: 'flashcards', sourceIds: ['not-found'] });
    const blocked = await request(app).post('/api/creator/generate').set(auth()).send({ resourceType: 'flashcards', sourceUrl: 'http://127.0.0.1/private' });
    const after = await request(app).get('/api/creator/quota').set(auth());
    expect(missing.status).toBe(400);
    expect(blocked.status).toBe(400);
    expect(after.body.quotas.artifacts.used).toBe(before.body.quotas.artifacts.used);
  });
  it('does not fabricate an AI quiz or a legacy resource when generation is unavailable', async () => {
    const quiz = await request(app).post('/api/ai/quiz/generate').set(auth()).send({ topic: 'Photosynthesis' });
    const legacy = await request(app).post('/api/ai/generate-resource').set(auth()).send({ content: 'Photosynthesis' });
    expect(quiz.status).toBe(503); expect(quiz.body.questions).toBeUndefined();
    expect(legacy.status).toBe(503); expect(legacy.body.resource).toBeUndefined();
  });
  it('discloses other generic guidance and keyword-based oral evaluation', async () => {
    const notes = await request(app).post('/api/ai/generate-content').set(auth()).send({ topic: 'Calculus' });
    const chat = await request(app).post('/api/ai/copilot/chat').set(auth()).send({ prompt: 'Explain a derivative.' });
    const voice = await request(app).post('/api/ai/voice-exam-eval').set(auth()).send({ rubric: 'conservation of energy', thesis: 'conservation of energy is incorrect' });
    expect(notes.body.fallback).toBe(true); expect(notes.body.content).toContain('AI is unavailable');
    expect(chat.body.fallback).toBe(true); expect(chat.body.reply).toContain('AI is unavailable');
    expect(voice.body.mode).toBe('deterministic_offline'); expect(voice.body.strength).not.toContain('Accurately');
  });
});
