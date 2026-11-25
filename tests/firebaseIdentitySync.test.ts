import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string; email: string; displayName?: string } },
  setDoc: vi.fn(async () => {}),
}));
vi.mock('../src/services/firebaseClient', () => ({ auth: mocks.auth, db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, uid: string) => ({ collection, uid })),
  setDoc: mocks.setDoc, getDocs: vi.fn(), collection: vi.fn(), onSnapshot: vi.fn(),
}));
import { syncClientToFirestore, syncXpToFirestoreAndBackend } from '../src/services/clientFirestoreSync';

afterEach(() => { vi.unstubAllGlobals(); mocks.setDoc.mockClear(); mocks.auth.currentUser = null; });

describe('Firestore identity isolation', () => {
  it('does not write another Firebase user when the local account differs', async () => {
    mocks.auth.currentUser = { uid: 'firebase-b', email: 'other@example.test', displayName: 'Other' };
    const fetch = vi.fn(async (_url: string, _options: { body: string }) => ({ ok: true }));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'learnco_user' ? JSON.stringify({ id: 'local-a' }) : null, removeItem: vi.fn() });
    await syncClientToFirestore({ id: 'local-a', email: 'alice@example.test' }, null, null);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('continues to sync when Firebase and local email match', async () => {
    mocks.auth.currentUser = { uid: 'firebase-a', email: 'ALICE@example.test' };
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'learnco_user' ? JSON.stringify({ id: 'local-a' }) : null, removeItem: vi.fn() });
    await syncClientToFirestore({ id: 'local-a', email: 'alice@example.test' }, null, null);
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    expect(mocks.setDoc.mock.calls.every((call: any) => call[0].collection === 'users')).toBe(true);
    for (const call of mocks.setDoc.mock.calls as any[]) {
      expect(call[1]).not.toHaveProperty('xp');
      expect(call[1]).not.toHaveProperty('level');
    }
  });

  it('stops after a session changes during an in-flight Firestore write', async () => {
    mocks.auth.currentUser = { uid: 'firebase-a', email: 'alice@example.test' };
    let userId = 'local-a';
    let finish!: () => void;
    mocks.setDoc.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'learnco_user' ? JSON.stringify({ id: userId }) : null, removeItem: vi.fn() });
    const pending = syncClientToFirestore({ id: 'local-a', email: 'alice@example.test' }, null, null);
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    userId = 'local-b';
    finish();
    await pending;
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not send XP to an unrelated Firebase identity', async () => {
    mocks.auth.currentUser = { uid: 'firebase-b', email: 'other@example.test' };
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'learnco_user' ? JSON.stringify({ id: 'local-a', email: 'alice@example.test' }) : null });
    await syncXpToFirestoreAndBackend(50);
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
});
