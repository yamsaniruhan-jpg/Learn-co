import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  generateFreshParameterizedQuestions,
  resolveParameterizedQuestionById,
} from '../server/services/parameterizedQuestionGenerator';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';
import { ICT_CODING_PROBLEMS, runICTCodeInSandbox } from '../src/data/ictCodingProblems';

let app: Express;
let token: string;

const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  vi.stubEnv('FIREBASE_ADMIN_DISABLED', 'true');
  vi.stubEnv('GEMINI_API_KEY', '');
  app = await (await import('../server')).createApp();
  const signup = await request(app).post('/api/auth/signup').send({
    email: `olympiad-${Date.now()}@example.test`,
    password: 'Password123',
    fullName: 'Olympiad Scholar',
  });
  expect(signup.status).toBe(201);
  token = signup.body.token;
}, 60_000);

describe('Olympiad & Platform Upgrades', () => {
  it('generates deterministic parameterized questions resolvable by ID and never repeats excluded seeds', () => {
    const batch1 = generateFreshParameterizedQuestions({
      subjectId: 'physics',
      count: 6,
      excludeIds: new Set(),
    });
    expect(batch1.length).toBe(6);

    const first = batch1[0];
    expect(first.id).toMatch(/^q-param-/);

    const resolved = resolveParameterizedQuestionById(first.id);
    expect(resolved).not.toBeNull();
    expect(resolved!.questionText).toBe(first.questionText);
    expect(resolved!.correctAnswer).toEqual(first.correctAnswer);

    const excluded = new Set(batch1.map((q) => q.id));
    const batch2 = generateFreshParameterizedQuestions({
      subjectId: 'physics',
      count: 6,
      excludeIds: excluded,
    });
    expect(batch2.length).toBe(6);
    for (const q of batch2) {
      expect(excluded.has(q.id)).toBe(false);
    }
  });

  it('supplements exhausted static bank selections with fresh parameterized questions and resists forged keys', async () => {
    const topicId = 'phys-topic-work-energy';
    const allStaticTopicIds = MASTER_QUESTION_BANK.filter(
      (q) => q.subjectId === 'physics' && q.topicId === topicId
    ).map((q) => q.id);
    const sessionRes = await request(app)
      .post('/api/learning/session/start')
      .set(auth())
      .send({
        config: {
          subjectId: 'physics',
          topicId,
          questionCount: 5,
          timed: false,
          excludeQuestionIds: allStaticTopicIds,
        },
      });

    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.questions.length).toBe(5);
    const paramQuestion = sessionRes.body.questions.find((q: any) =>
      String(q.id).startsWith('q-param-')
    );
    expect(paramQuestion).toBeDefined();
    expect(allStaticTopicIds.includes(paramQuestion.id)).toBe(false);

    // Attempt to forge answer key on the parameterized question
    const forgedAnswer =
      typeof paramQuestion.correctAnswer === 'number'
        ? paramQuestion.correctAnswer + 9999
        : '__FORGED_WRONG_KEY__';
    const submitRes = await request(app)
      .post('/api/practice/submit-attempt')
      .set(auth())
      .send({
        attemptId: `param-forge-${Date.now()}`,
        questionId: paramQuestion.id,
        subjectId: 'physics',
        selectedAnswer: forgedAnswer,
        correctAnswer: forgedAnswer,
        isCorrect: true,
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.isCorrect).toBe(false);
    expect(submitRes.body.xpEarned).toBe(0);

    // Check cross-device solved-ids endpoint includes the attempted parameterized ID
    const solvedRes = await request(app).get('/api/practice/solved-ids').set(auth());
    expect(solvedRes.status).toBe(200);
    expect(Array.isArray(solvedRes.body.solvedIds)).toBe(true);
    expect(solvedRes.body.solvedIds).toContain(paramQuestion.id);
  });

  it('runs delayed-grading Olympiad mock contest lifecycle without leaking solutions early', async () => {
    const startRes = await request(app)
      .post('/api/learning/contest/start')
      .set(auth())
      .send({
        track: 'ipho',
        durationMinutes: 30,
        questionCount: 5,
      });

    expect(startRes.status).toBe(200);
    expect(startRes.body.success).toBe(true);
    expect(startRes.body.durationSeconds).toBe(1800);
    expect(startRes.body.questions.length).toBe(5);

    for (const q of startRes.body.questions) {
      expect(q.correctAnswer).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.stepByStepSolution).toBeUndefined();
    }

    // Answer questions accurately using server bank / parameterized lookup to verify medal & review grading
    const answers: Record<string, any> = {};
    const questionIds: string[] = [];
    for (const q of startRes.body.questions) {
      questionIds.push(q.id);
      const canonical =
        MASTER_QUESTION_BANK.find((b) => b.id === q.id) ||
        resolveParameterizedQuestionById(q.id);
      if (canonical) {
        answers[q.id] = canonical.correctAnswer;
      }
    }

    const submitRes = await request(app)
      .post('/api/learning/contest/submit')
      .set(auth())
      .send({
        contestId: startRes.body.contestId,
        track: 'ipho',
        questionIds,
        answers,
        timeSpentSeconds: 420,
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.correctCount).toBe(5);
    expect(submitRes.body.accuracy).toBe(100);
    expect(submitRes.body.medalTier).toContain('Gold');
    expect(submitRes.body.reviews.length).toBe(5);
    expect(submitRes.body.reviews[0].question.explanation).toBeTruthy();
  });

  it('evaluates all 6 ICT coding problems correctly in sandbox and flags buggy submissions', async () => {
    for (const prob of ICT_CODING_PROBLEMS) {
      const allCases = [...prob.sampleCases, ...prob.hiddenCases];
      const passRes = await runICTCodeInSandbox(prob.referenceSolution, allCases, 2000);
      expect(passRes.compileError).toBeUndefined();
      expect(passRes.timedOut).toBe(false);
      expect(passRes.success).toBe(true);
      expect(passRes.passedCount).toBe(allCases.length);
    }

    const first = ICT_CODING_PROBLEMS[0];
    const failRes = await runICTCodeInSandbox(
      'function solve() { return [-999, -999]; }',
      [...first.sampleCases, ...first.hiddenCases],
      2000
    );
    expect(failRes.success).toBe(false);
    expect(failRes.passedCount).toBe(0);

    const errRes = await runICTCodeInSandbox('function notSolve() {}', first.sampleCases, 2000);
    expect(errRes.success).toBe(false);
    expect(errRes.compileError).toBeTruthy();
  });
});
