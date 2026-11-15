import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('creator generation persistence', () => {
  it('persists the generated resource and version before returning success', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-creator-restart-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, FIREBASE_ADMIN_DISABLED: 'true', GEMINI_API_KEY: '' };
    const run = (script: string) => {
      const p = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { cwd: process.cwd(), env, encoding: 'utf8', timeout: 30000 });
      expect(p.status, p.stderr).toBe(0);
      return p.stdout.trim().split('\n').find(line => line.startsWith('RESULT:'))?.slice(7);
    };
    const created = JSON.parse(run(`
      import request from 'supertest';
      import {createApp} from './server.ts';
      const app = await createApp();
      const user = await request(app).post('/api/auth/signup').send({email:'restart-creator@example.test',password:'Password123',fullName:'Restart Tester'});
      const token = user.body.token;
      const source = await request(app).post('/api/creator/sources').set('Authorization','Bearer '+token).send({sourceType:'text',content:'A derivative is an instantaneous rate of change.'});
      if (source.status !== 201) throw Error('source status: '+source.status);
      const resource = await request(app).post('/api/creator/generate').set('Authorization','Bearer '+token).send({sourceId:source.body.source.id,resourceType:'flashcards'});
      if (resource.status !== 201) throw Error('generation status: '+resource.status);
      console.log('RESULT:'+JSON.stringify({userId:user.body.user.id,id:resource.body.resource.id}));
      process.exit(0);
    `)!);
    const restored = JSON.parse(run(`
      import {Database} from './server/db.ts';
      const resource = Database.getResource(${JSON.stringify(created.userId)}, ${JSON.stringify(created.id)});
      const versions = Database.getResourceVersions(${JSON.stringify(created.userId)}, ${JSON.stringify(created.id)});
      console.log('RESULT:'+JSON.stringify({exists:!!resource, tags:resource?.tags, versions:versions.length}));
      process.exit(0);
    `)!);
    expect(restored).toMatchObject({ exists: true, tags: expect.arrayContaining(['template-generated']), versions: 1 });
  }, 60_000);

  it('persists user-requested source deletion and resource edits/deletion across restarts', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'learnco-creator-actions-')), 'db.json');
    const env = { ...process.env, NODE_ENV: 'test', LEARNCO_DB_FILE: file, FIREBASE_ADMIN_DISABLED: 'true', GEMINI_API_KEY: '' };
    const run = (script: string) => {
      const p = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { cwd: process.cwd(), env, encoding: 'utf8', timeout: 30000 });
      expect(p.status, p.stderr).toBe(0);
      return p.stdout.trim().split('\n').find(line => line.startsWith('RESULT:'))?.slice(7);
    };
    const state = JSON.parse(run(`
      import request from 'supertest'; import {createApp} from './server.ts';
      const app=await createApp();
      const signup=await request(app).post('/api/auth/signup').send({email:'creator-actions@example.test',password:'Password123',fullName:'Actions Tester'});
      const token=signup.body.token, auth='Bearer '+token;
      const source=await request(app).post('/api/creator/sources').set('Authorization',auth).send({sourceType:'text',content:'A derivative is a rate of change.'});
      const generated=await request(app).post('/api/creator/generate').set('Authorization',auth).send({sourceId:source.body.source.id,resourceType:'flashcards'});
      const edit=await request(app).put('/api/creator/resources/'+generated.body.resource.id).set('Authorization',auth).send({title:'Edited title',content:{flashcards:[]}});
      const deletion=await request(app).delete('/api/creator/sources/'+source.body.source.id).set('Authorization',auth);
      if ([source.status,generated.status,edit.status,deletion.status].join() !== '201,201,200,200') throw Error('action status failed');
      console.log('RESULT:'+JSON.stringify({userId:signup.body.user.id,token,source:source.body.source.id,resource:generated.body.resource.id})); process.exit(0);
    `)!);
    const persisted = JSON.parse(run(`
      import {Database} from './server/db.ts';
      const res=Database.getResource(${JSON.stringify(state.userId)},${JSON.stringify(state.resource)});
      console.log('RESULT:'+JSON.stringify({source:!!Database.getSource(${JSON.stringify(state.userId)},${JSON.stringify(state.source)}),title:res?.title,versions:Database.getResourceVersions(${JSON.stringify(state.userId)},${JSON.stringify(state.resource)}).length})); process.exit(0);
    `)!);
    expect(persisted).toEqual({source:false,title:'Edited title',versions:2});
    run(`
      import request from 'supertest'; import {createApp} from './server.ts';
      const app=await createApp(); const res=await request(app).delete('/api/creator/resources/'+${JSON.stringify(state.resource)}).set('Authorization','Bearer '+${JSON.stringify(state.token)});
      if(res.status !== 200) throw Error('resource delete failed '+res.status);
      console.log('RESULT:ok'); process.exit(0);
    `);
    const after = JSON.parse(run(`
      import {Database} from './server/db.ts';
      console.log('RESULT:'+JSON.stringify({resource:!!Database.getResource(${JSON.stringify(state.userId)},${JSON.stringify(state.resource)}),versions:Database.getResourceVersions(${JSON.stringify(state.userId)},${JSON.stringify(state.resource)}).length})); process.exit(0);
    `)!);
    expect(after).toEqual({resource:false,versions:0});
  }, 90_000);

});
