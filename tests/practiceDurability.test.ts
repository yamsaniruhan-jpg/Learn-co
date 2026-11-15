import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('practice durability', () => {
  it('persists an accepted bank attempt, XP and retry id across an immediate restart', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-practice-restart-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, FIREBASE_ADMIN_DISABLED: 'true' };
    const run = (script: string) => {
      const p = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { cwd: process.cwd(), env, encoding: 'utf8', timeout: 30000 });
      expect(p.status, p.stderr).toBe(0);
      return p.stdout.trim().split('\n').find(line => line.startsWith('RESULT:'))?.slice(7);
    };
    const user = JSON.parse(run(`
      import request from 'supertest'; import {createApp} from './server.ts'; import {MASTER_QUESTION_BANK} from './server/data/questionBankData.ts';
      const app=await createApp();
      const signup=await request(app).post('/api/auth/signup').send({email:'practice-restart@example.test',password:'Password123',fullName:'Restart Tester'});
      const question=MASTER_QUESTION_BANK.find(q=>typeof q.correctAnswer==='string');
      const attempt=await request(app).post('/api/practice/submit-attempt').set('Authorization','Bearer '+signup.body.token).send({attemptId:'restart-practice-1',questionId:question.id,subjectId:question.subjectId,selectedAnswer:question.correctAnswer,isCorrect:true});
      if(attempt.status!==200||attempt.body.xpEarned!==5) throw Error('submit failed');
      console.log('RESULT:'+JSON.stringify({token:signup.body.token,questionId:question.id,subjectId:question.subjectId,answer:question.correctAnswer})); process.exit(0);
    `)!);
    const retry = JSON.parse(run(`
      import request from 'supertest'; import {createApp} from './server.ts';
      const app=await createApp();
      const res=await request(app).post('/api/practice/submit-attempt').set('Authorization','Bearer '+${JSON.stringify(user.token)}).send({attemptId:'restart-practice-1',questionId:${JSON.stringify(user.questionId)},subjectId:${JSON.stringify(user.subjectId)},selectedAnswer:${JSON.stringify(user.answer)},isCorrect:true});
      console.log('RESULT:'+JSON.stringify({status:res.status,xp:res.body.xpEarned,total:res.body.newTotalXp,verification:res.body.verification})); process.exit(0);
    `)!);
    expect(retry).toEqual({status:200,xp:0,total:5,verification:'bank'});
  }, 60_000);
});
