import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const compatPath = require.resolve('../server/services/firebaseAdminCompat.cjs');
const servicePath = require.resolve('../services/marketplaceService.js');
let courses: Record<string, any>, writes: any[], service: any, transactionFailure: boolean;

function loadService(configured = true) {
  const snapshot = (id: string) => ({ exists: !!courses[id], data: () => courses[id], id });
  const doc = (id: string): any => ({ id, get: async () => snapshot(id), collection: () => ({ doc: (name: string) => ({ id: name }) }) });
  const query: any = {
    where: () => query, orderBy: () => { throw new Error('missing index'); }, limit: () => query,
    get: async () => ({ docs: Object.keys(courses).map(snapshot) }),
  };
  const db = {
    collection: (name: string) => name === 'marketplace' ? { ...query, doc } : { doc },
    runTransaction: async (callback: any) => {
      if (transactionFailure) throw new Error('storage unavailable');
      return callback({ get: async (ref: any) => snapshot(ref.id), set: (...args: any[]) => writes.push(args) });
    },
  };
  const firestore = Object.assign(() => configured ? db : null, { FieldValue: { serverTimestamp: () => 'server-time', increment: (n: number) => n } });
  const admin = { apps: configured ? [{}] : [], app: () => ({}), firestore };
  delete require.cache[servicePath];
  require.cache[compatPath] = { id: compatPath, filename: compatPath, loaded: true, exports: admin } as any;
  return require(servicePath);
}
beforeEach(() => { courses = {}; writes = []; transactionFailure = false; service = loadService(); });

describe('marketplace safety', () => {
  const details = { title: 'My course', description: 'Notes', subject: 'Math', price: 0 };
  it('does not let a user overwrite a different creator’s course', async () => {
    courses.c1 = { creatorUid: 'alice', status: 'published' };
    await expect(service.publishCourse('bob', 'c1', details)).rejects.toMatchObject({ statusCode: 403 });
    expect(writes).toHaveLength(0);
  });
  it('preserves server-owned counters on edits and initializes new ones', async () => {
    courses.c1 = { creatorUid: 'alice', status: 'published', rating: 4, enrolledCount: 9 };
    await service.publishCourse('alice', 'c1', { ...details, rating: 5, enrolledCount: 999 });
    expect(writes[0][1]).not.toHaveProperty('rating');
    expect(writes[0][1]).not.toHaveProperty('enrolledCount');
    writes = [];
    await service.publishCourse('alice', 'c2', { ...details, rating: 5, enrolledCount: 999 });
    expect(writes[0][1]).toMatchObject({ rating: 0, ratingCount: 0, enrolledCount: 0, creatorUid: 'alice' });
  });
  it('fails publishing if Firestore is unavailable rather than falsely reporting success', async () => {
    service = loadService(false);
    await expect(service.publishCourse('alice', 'c1', details)).rejects.toMatchObject({ statusCode: 503 });
  });
  it('does not expose a failed publication in the runtime catalog', async () => {
    transactionFailure = true;
    await expect(service.publishCourse('alice', 'failed-course', details)).rejects.toMatchObject({ statusCode: 503 });
    const result = await service.searchCourses({ limit: '100' });
    expect(result.courses.some((course: any) => course.id === 'failed-course')).toBe(false);
  });
  it('never returns unpublished documents when a search index is missing', async () => {
    courses.public = { status: 'published', title: 'Public', subject: 'math', difficulty: 'beginner' };
    courses.private = { status: 'draft', title: 'Private', subject: 'math', difficulty: 'beginner' };
    const results = await service.searchCourses({ limit: '12' });
    expect(results.courses.map((r: any) => r.id)).toEqual(['public']);
    expect(results.catalogSource).toBe('firebase');
  });
  it('blocks non-existent, unpublished, and unpaid courses', async () => {
    courses.paid = { status: 'published', price: 20 };
    courses.draft = { status: 'draft', price: 0 };
    await expect(service.enrollCourse('alice', 'paid')).rejects.toMatchObject({ statusCode: 402 });
    await expect(service.enrollCourse('alice', 'draft')).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.enrollCourse('alice', 'missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
