import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { Database } from '../server/db';
import { MASTER_QUESTION_BANK } from '../server/data/questionBankData';
let app: Express, alice: string, bob: string, aliceId: string;
const auth=(token:string)=>({Authorization:`Bearer ${token}`});
beforeAll(async()=>{
  app=await (await import('../server')).createApp();
  const signup=async(name:string)=>{const r=await request(app).post('/api/auth/signup').send({email:`${name}-${Date.now()}@example.test`,password:'Password123',fullName:name});expect(r.status).toBe(201);return r.body;};
  const a=await signup('creator-alice'), b=await signup('creator-bob');alice=a.token;aliceId=a.user.id;bob=b.token;
});
const create=(quiz:any)=>Database.createResource(aliceId,{title:'Private Notes',resourceType:'quiz',content:{quiz},isPublic:false});
describe('private creator quiz transfers',()=>{
  it('does not promote creator questions into the shared bank or award verified XP',async()=>{
    const source=create([{question:'UniquePrivateTransferQuestion',options:['One','Two'],correctIndex:1,explanation:'Test explanation'}]);
    const before=MASTER_QUESTION_BANK.length;
    expect((await request(app).post(`/api/creator/resources/${source.id}/add-to-practice`).set(auth(bob))).status).toBe(404);
    const transfer=await request(app).post(`/api/creator/resources/${source.id}/add-to-practice`).set(auth(alice));
    expect(transfer.status).toBe(200);const q=transfer.body.questions[0];
    expect(q).toMatchObject({questionText:'UniquePrivateTransferQuestion',correctAnswer:'Two',verificationStatus:'creator_imported'});
    expect(MASTER_QUESTION_BANK).toHaveLength(before);
    const foreign=await request(app).get('/api/learning/questions?search=UniquePrivateTransferQuestion').set(auth(bob));
    const anonymous=await request(app).get('/api/learning/questions?search=UniquePrivateTransferQuestion');
    expect(foreign.body.questions).toEqual([]);expect(anonymous.body.questions).toEqual([]);
    const attempt=await request(app).post('/api/practice/submit-attempt').set(auth(alice)).send({attemptId:'creator-private-attempt',questionId:q.id,subjectId:'math',selectedAnswer:'Two',isCorrect:true});
    expect(attempt.status).toBe(200);expect(attempt.body.verification).toBe('unverified');expect(attempt.body.xpEarned).toBe(0);
  });
  it('keeps the separate learning import account-scoped and validates its answer key',async()=>{
    const source=create([{question:'AnotherUniquePrivateQuiz',options:['First','Second'],correctIndex:1}]);
    const imported=await request(app).post('/api/learning/import-creator-quiz').set(auth(alice)).send({resourceId:source.id});
    expect(imported.status).toBe(200);expect(imported.body.questions[0].correctAnswer).toBe('Second');
    const mine=await request(app).get('/api/learning/questions?search=AnotherUniquePrivateQuiz').set(auth(alice));
    const other=await request(app).get('/api/learning/questions?search=AnotherUniquePrivateQuiz').set(auth(bob));
    expect(mine.body.questions).toHaveLength(1);expect(other.body.questions).toEqual([]);
  });
  it('rejects incomplete or contradictory quizzes and unsupported flashcards without fabricating choices',async()=>{
    const invalid=create([{question:'Missing key',options:['A','B']},{question:'Other',options:['A','B'],correctIndex:0}]);
    for (const path of [`/api/creator/resources/${invalid.id}/add-to-practice`,'/api/learning/import-creator-quiz']) {
      const response=await request(app).post(path).set(auth(alice)).send({resourceId:invalid.id});
      expect(response.status).toBe(422);
    }
    const contradiction=create([{question:'Conflicting key',options:['A','B'],correctIndex:0,correctAnswer:'B'}]);
    expect((await request(app).post(`/api/creator/resources/${contradiction.id}/add-to-practice`).set(auth(alice))).status).toBe(422);
    const flash=Database.createResource(aliceId,{title:'Flash',resourceType:'flashcards',content:{flashcards:[{front:'Q',back:'A'}]}});
    expect((await request(app).post(`/api/creator/resources/${flash.id}/add-to-practice`).set(auth(alice))).status).toBe(422);
  });
});
