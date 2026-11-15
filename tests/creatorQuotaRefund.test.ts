import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
const extraction = vi.hoisted(() => ({ extract: vi.fn() }));
vi.mock('../server/services/documentExtraction', async importOriginal => ({ ...(await importOriginal<any>()), extractUrlText: extraction.extract }));
import { Database } from '../server/db';
let app: Express, token: string, userId: string;
beforeAll(async () => {
  vi.setSystemTime(new Date('2030-01-01T23:59:58Z'));
  app=await (await import('../server')).createApp();
  const signup=await request(app).post('/api/auth/signup').send({email:`quota-${Date.now()}@example.test`,password:'Password123',fullName:'Quota Test'});
  expect(signup.status).toBe(201);token=signup.body.token;userId=signup.body.user.id;
});
afterEach(()=>{vi.useRealTimers();extraction.extract.mockReset();});
describe('creator quota reservation',()=>{
  it('does not refund yesterday’s slow failed extraction against today’s usage',async()=>{
    vi.setSystemTime(new Date('2030-01-01T23:59:58Z'));
    let reject!: (reason:Error)=>void;
    extraction.extract.mockImplementationOnce(()=>new Promise((_resolve,rej)=>{reject=rej;}));
    const pending=request(app).post('/api/creator/sources').set('Authorization',`Bearer ${token}`).send({sourceType:'url',url:'https://example.com'}).then(r=>r);
    await vi.waitFor(()=>expect(reject).toBeTypeOf('function'));
    expect(Database.getUserDailyQuotas(userId).urls.used).toBe(1);
    vi.setSystemTime(new Date('2030-01-02T00:00:02Z'));
    Database.checkAndIncrementUrlQuota(userId);
    reject(new Error('fetch failed'));
    expect((await pending).status).toBe(500);
    expect(Database.getUserDailyQuotas(userId).urls.used).toBe(1);
  });
});
