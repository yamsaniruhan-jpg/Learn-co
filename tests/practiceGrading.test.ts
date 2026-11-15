import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';

let app: Express, token: string;
const multi = MASTER_QUESTION_BANK.find(q => q.id === 'q-math-deriv-03')!;
const numerical = MASTER_QUESTION_BANK.find(q => q.id === 'q-cs-grad-03')!;
let counter = 0;
beforeAll(async () => {
  app = await (await import('../server')).createApp();
  const signup = await request(app).post('/api/auth/signup').send({ email: `grading-${Date.now()}@example.test`, password: 'Password123', fullName: 'Grading Test' });
  expect(signup.status).toBe(201); token = signup.body.token;
}, 60_000);
const submit = (questionId: string, selectedAnswer: unknown, extra: object = {}) => request(app)
  .post('/api/practice/submit-attempt').set('Authorization', `Bearer ${token}`)
  .send({attemptId:`grading-${++counter}`, questionId, subjectId:'math', selectedAnswer, isCorrect:true, ...extra});

describe('authoritative practice grading', () => {
  it('grades reordered selections and legacy strings with embedded commas, without re-awarding XP', async () => {
    const choices = multi.correctAnswer as string[];
    const first = await submit(multi.id, [...choices].reverse(), { correctAnswer:'forged', attemptId:'grading-replay' });
    expect(first.status).toBe(200); expect(first.body.isCorrect).toBe(true); expect(first.body.xpEarned).toBe(5);
    const retry = await submit(multi.id, ['wrong'], { attemptId:'grading-replay' });
    expect(retry.body.isCorrect).toBe(true); expect(retry.body.xpEarned).toBe(0);
    const legacy = await submit(multi.id, [...choices].reverse().join(', '));
    expect(legacy.body.isCorrect).toBe(true); expect(legacy.body.xpEarned).toBe(0);
    const forged = await submit(multi.id, [choices[0], choices[0], choices[1]], {correctAnswer:[choices[0], choices[0], choices[1]]});
    expect(forged.body.isCorrect).toBe(false); expect(forged.body.xpEarned).toBe(0);
  });
  it('uses the corrected numerical answer and its tolerance, not client keys', async () => {
    expect(numerical.correctAnswer).toBe(1.92);
    const correct = await submit(numerical.id, '1.93', {correctAnswer:'wrong'});
    expect(correct.body.isCorrect).toBe(true); expect(correct.body.xpEarned).toBe(5);
    const wrong = await submit(numerical.id, '2.88', {correctAnswer:'2.88'});
    expect(wrong.body.isCorrect).toBe(false); expect(wrong.body.xpEarned).toBe(0);
    const strict = await submit('q-math-deriv-04', '6.000000001');
    expect(strict.body.isCorrect).toBe(false);
  });
  it('validates payloads and preserves unverified self-checks without awarding XP', async () => {
    for (const selected of [null, {}, [], ['A', null], '']) {
      const bad = await submit(multi.id, selected);
      expect(bad.status).toBe(400);
    }
    const selfCheck = await submit('unknown-custom', ['one, two', 'three'], {isCorrect:false});
    expect(selfCheck.body.isCorrect).toBe(false); expect(selfCheck.body.verification).toBe('unverified'); expect(selfCheck.body.xpEarned).toBe(0);
  });
  it('applies the same grading in copilot practice', async () => {
    const res = await request(app).post('/api/copilot/practice/submit').set('Authorization', `Bearer ${token}`)
      .send({questionId:multi.id, userAnswer:[...(multi.correctAnswer as string[])].reverse(), correctAnswer:'forged'});
    expect(res.status).toBe(200); expect(res.body.isCorrect).toBe(true); expect(res.body.xpEarned).toBe(0);
    const invalid = await request(app).post('/api/copilot/practice/submit').set('Authorization', `Bearer ${token}`)
      .send({questionId:multi.id, userAnswer:{}, correctAnswer:'forged'});
    expect(invalid.status).toBe(400);
  });
});
