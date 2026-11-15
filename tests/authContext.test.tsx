// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(), getMe: vi.fn(), removeToken: vi.fn(), signIn: vi.fn(), setCurrentUser: vi.fn(),
  auth: { app: {}, currentUser: null as null | { email: string } },
  firebaseSignIn: vi.fn(), firebaseSignOut: vi.fn(async () => {}),
}));
vi.mock('../src/services/authClient', () => ({ AuthClient: mocks }));
vi.mock('../src/services/clientFirestoreSync', () => ({
  syncClientToFirestore: vi.fn(async () => {}),
  hasMatchingFirebaseIdentity: (a: string, b: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase(),
}));
vi.mock('../src/services/firebaseClient', () => ({
  auth: mocks.auth, googleProvider: {}, signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: mocks.firebaseSignIn, createUserWithEmailAndPassword: vi.fn(), signOut: mocks.firebaseSignOut,
}));
import { AuthProvider, useAuth } from '../src/context/AuthContext';

let snapshot: ReturnType<typeof useAuth>;
function Probe() { snapshot = useAuth(); return null; }
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  mocks.getToken.mockReset(); mocks.getMe.mockReset(); mocks.removeToken.mockReset(); mocks.signIn.mockReset();
  mocks.setCurrentUser.mockReset();
  mocks.firebaseSignIn.mockReset(); mocks.firebaseSignOut.mockClear(); mocks.auth.currentUser = null;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe('session refresh failures', () => {
  it('retains the verified account’s device activity when refreshing server XP', async () => {
    localStorage.setItem('learnco_auth_token', 'stored-session');
    localStorage.setItem('learnco_user', JSON.stringify({id: 'old-account'}));
    localStorage.setItem('learnco_xp_v2:account:alice:activity', '40');
    localStorage.setItem('learnco_xp_v2:account:old-account:activity', '900');
    mocks.getToken.mockReturnValue('stored-session');
    mocks.getMe.mockResolvedValue({ user: {id: 'alice'}, profile: null, settings: null, gamification: {userId: 'alice', xp: 20, level: 1} });
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.setCurrentUser).toHaveBeenCalledWith({id: 'alice'});
    expect(snapshot.gamification?.xp).toBe(60);
    expect(localStorage.getItem('learnco_xp_v2:account:alice:server')).toBe('20');
    expect(localStorage.getItem('learnco_xp_v2:account:old-account:server')).toBeNull();
  });

  it('preserves a stored token during a temporary server failure', async () => {
    mocks.getToken.mockReturnValue('stored-session');
    mocks.getMe.mockRejectedValue(Object.assign(new Error('service unavailable'), { status: 503 }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.removeToken).not.toHaveBeenCalled();
    expect(snapshot.isAuthenticated).toBe(false);
    expect(snapshot.authError).toMatch(/could not verify/i);
  });

  it('clears an explicitly rejected session', async () => {
    mocks.getToken.mockReturnValue('expired-session');
    mocks.getMe.mockRejectedValue(Object.assign(new Error('unauthorized'), { status: 401 }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.removeToken).toHaveBeenCalledOnce();
    expect(snapshot.isAuthenticated).toBe(false);
  });

  it('clears a Firebase sign-in if backend password verification fails', async () => {
    mocks.getToken.mockReturnValue(null);
    mocks.firebaseSignIn.mockResolvedValue({ user: { getIdToken: async () => 'firebase-token' } });
    mocks.signIn.mockRejectedValue(new Error('Invalid credentials'));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => {
      await expect(snapshot.signInWithEmail('alice@example.test', 'password')).rejects.toThrow('Invalid credentials');
    });
    expect(mocks.firebaseSignOut).toHaveBeenCalledOnce();
    expect(snapshot.isAuthenticated).toBe(false);
  });

  it('signs out a mismatched Firebase identity after backend sign-in', async () => {
    mocks.getToken.mockReturnValue(null);
    mocks.firebaseSignIn.mockRejectedValue(new Error('Firebase unavailable'));
    mocks.auth.currentUser = { email: 'other@example.test' };
    mocks.signIn.mockResolvedValue({ user: { id: 'local-a', email: 'alice@example.test' }, profile: null, gamification: null, settings: null });
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => { await snapshot.signInWithEmail('alice@example.test', 'password'); });
    expect(mocks.firebaseSignOut).toHaveBeenCalledOnce();
    expect(snapshot.isAuthenticated).toBe(true);
  });

  it('does not clear a newer token when an old refresh finishes late', async () => {
    let token = 'old-session';
    mocks.getToken.mockImplementation(() => token);
    let reject!: (error: Error) => void;
    mocks.getMe.mockReturnValue(new Promise((_resolve, r) => { reject = r; }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    token = 'new-session';
    await act(async () => { reject(Object.assign(new Error('unauthorized'), { status: 401 })); });
    expect(mocks.removeToken).not.toHaveBeenCalled();
  });
});
