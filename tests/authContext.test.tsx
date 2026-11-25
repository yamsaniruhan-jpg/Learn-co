// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionId: vi.fn(), getMe: vi.fn(), clearSession: vi.fn(), signIn: vi.fn(), setCurrentUser: vi.fn(),
  updateProfile: vi.fn(), updateSettings: vi.fn(), uploadAvatar: vi.fn(), saveOnboarding: vi.fn(), signOut: vi.fn(async () => {}),
  auth: { app: {}, currentUser: null as null | { email: string } },
  firebaseSignIn: vi.fn(), firebaseSignOut: vi.fn(async () => {}),
  popup: vi.fn(), redirect: vi.fn(), redirectResult: vi.fn(async (): Promise<any> => null), google: vi.fn(), signUp: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));
vi.mock('../src/services/authClient', () => ({ AuthClient: { ...mocks, signInWithGoogle: mocks.google } }));
vi.mock('../src/services/clientFirestoreSync', () => ({
  syncClientToFirestore: vi.fn(async () => {}),
  hasMatchingFirebaseIdentity: (a: string, b: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase(),
}));
vi.mock('../src/services/firebaseClient', () => ({
  auth: mocks.auth, googleProvider: {}, signInWithPopup: mocks.popup,
  signInWithRedirect: mocks.redirect, getRedirectResult: mocks.redirectResult,
  signInWithEmailAndPassword: mocks.firebaseSignIn, createUserWithEmailAndPassword: vi.fn(), signOut: mocks.firebaseSignOut,
  onAuthStateChanged: mocks.onAuthStateChanged,
}));
import { AuthProvider, useAuth } from '../src/context/AuthContext';

let snapshot: ReturnType<typeof useAuth>;
function Probe() { snapshot = useAuth(); return null; }
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  sessionStorage.clear();
  mocks.getSessionId.mockReset(); mocks.getMe.mockReset(); mocks.clearSession.mockReset(); mocks.signIn.mockReset();
  mocks.google.mockReset();
  mocks.setCurrentUser.mockReset();
  mocks.onAuthStateChanged.mockReset();
  mocks.firebaseSignIn.mockReset(); mocks.firebaseSignOut.mockClear(); mocks.auth.currentUser = null;
  mocks.popup.mockReset(); mocks.redirect.mockReset(); mocks.google.mockReset(); mocks.signUp.mockReset();
  mocks.updateProfile.mockReset(); mocks.updateSettings.mockReset(); mocks.uploadAvatar.mockReset(); mocks.saveOnboarding.mockReset(); mocks.signOut.mockClear();
  mocks.redirectResult.mockReset().mockResolvedValue(null); sessionStorage.clear();
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe('Google redirect and signup', () => {
  it('reports redirect initiation rather than signed-in success', async () => {
    mocks.getSessionId.mockReturnValue(null);
    mocks.popup.mockRejectedValue({ code: 'auth/popup-blocked' });
    mocks.redirect.mockResolvedValue(undefined);
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => { expect(await snapshot.signInWithGoogle()).toBe('redirecting'); });
    expect(mocks.google).not.toHaveBeenCalled();
    expect(snapshot.isAuthenticated).toBe(false);
  });

  it('surfaces redirect errors', async () => {
    mocks.getSessionId.mockReturnValue(null);
    mocks.redirectResult.mockRejectedValue(new Error('Redirect failed'));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(snapshot.authError).toBe('Redirect failed');
  });

  it('uses the redirected account when reconciling local XP', async () => {
    mocks.getSessionId.mockReturnValue(null);
    localStorage.setItem('learnco_xp_v2:account:alice:activity', '40');
    mocks.redirectResult.mockResolvedValue({ user: { email: 'alice@example.test', providerData: [], getIdToken: async () => 'google-token' } });
    mocks.google.mockResolvedValue({ user: { id: 'alice', email: 'alice@example.test' }, profile: null, gamification: { userId: 'alice', xp: 20, level: 1 }, settings: null });
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(snapshot.gamification?.xp).toBe(60);
  });

  it('rejects local signup before attempting Firebase provisioning', async () => {
    mocks.getSessionId.mockReturnValue(null);
    mocks.signUp.mockRejectedValue(new Error('Already exists'));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => { await expect(snapshot.signUpWithEmail('a@example.test', 'Password1')).rejects.toThrow('Already exists'); });
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(snapshot.isAuthenticated).toBe(false);
  });
});

describe('sign-in cancellation', () => {
  it('does not restore a signed-out account after slow Firebase sign-in', async () => {
    let sessionId: string | null = null;
    mocks.getSessionId.mockImplementation(() => sessionId);
    mocks.signOut.mockImplementation(async () => { sessionId = null; });
    mocks.signIn.mockImplementation(async () => { sessionId = '1:a'; return { user: { id: 'a', email: 'alice@example.test' }, profile: null, settings: null, gamification: null }; });
    let finish!: (value: any) => void;
    mocks.firebaseSignIn.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    let pending!: Promise<void>;
    await act(async () => { pending = snapshot.signInWithEmail('alice@example.test', 'Password1'); await Promise.resolve(); });
    await act(async () => { await snapshot.signOut(); });
    await act(async () => {
      finish({ user: { email: 'alice@example.test' } });
      await expect(pending).rejects.toThrow(/session changed/i);
    });
    expect(snapshot.isAuthenticated).toBe(false);
    expect(snapshot.user).toBeNull();
    expect(sessionId).toBeNull();
  });
});

describe('in-flight account updates', () => {
  it.each(['updateProfile', 'updateSettings', 'uploadAvatar', 'saveOnboarding'] as const)(
    'does not apply a stale %s response to another session', async (method) => {
      let sessionId: string | null = '1:a';
      mocks.getSessionId.mockImplementation(() => sessionId);
      mocks.getMe.mockResolvedValue({ user: { id: 'a' }, profile: { displayName: 'Alice' }, settings: null, gamification: { userId: 'a', xp: 0 } });
      let finish!: (value: any) => void;
      mocks[method].mockReturnValue(new Promise(resolve => { finish = resolve; }));
      await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
      let pending!: Promise<any>;
      await act(async () => {
        pending = method === 'uploadAvatar' ? snapshot.uploadAvatar('image')
          : method === 'saveOnboarding' ? snapshot.saveOnboarding({})
          : method === 'updateSettings' ? snapshot.updateSettings({}) : snapshot.updateProfile({});
      });
      sessionId = '2:b';
      await act(async () => {
        finish({ profile: { displayName: 'Stale Alice' }, settings: { theme: 'dark' }, avatarUrl: '/old' });
        await expect(pending).rejects.toThrow(/session changed/i);
      });
      expect(snapshot.profile?.displayName).not.toBe('Stale Alice');
    }
  );
});

describe('session refresh failures', () => {
  it('retains the verified account’s device activity when refreshing server XP', async () => {
    localStorage.setItem('learnco_user', JSON.stringify({id: 'old-account'}));
    localStorage.setItem('learnco_xp_v2:account:alice:activity', '40');
    localStorage.setItem('learnco_xp_v2:account:old-account:activity', '900');
    mocks.getSessionId.mockReturnValue('1:old-account');
    mocks.getMe.mockResolvedValue({ user: {id: 'alice'}, profile: null, settings: null, gamification: {userId: 'alice', xp: 20, level: 1} });
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.setCurrentUser).toHaveBeenCalledWith({id: 'alice'});
    expect(snapshot.gamification?.xp).toBe(60);
    expect(localStorage.getItem('learnco_xp_v2:account:alice:server')).toBe('20');
    expect(localStorage.getItem('learnco_xp_v2:account:old-account:server')).toBeNull();
  });

  it('preserves a stored session during a temporary server failure', async () => {
    mocks.getSessionId.mockReturnValue('1:alice');
    mocks.getMe.mockRejectedValue(Object.assign(new Error('service unavailable'), { status: 503 }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(snapshot.isAuthenticated).toBe(false);
    expect(snapshot.authError).toMatch(/could not verify/i);
  });

  it('clears an explicitly rejected session', async () => {
    mocks.getSessionId.mockReturnValue('1:alice');
    mocks.getMe.mockRejectedValue(Object.assign(new Error('unauthorized'), { status: 401 }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.clearSession).toHaveBeenCalledOnce();
    expect(snapshot.isAuthenticated).toBe(false);
  });

  it('does not contact Firebase when backend password verification fails', async () => {
    mocks.getSessionId.mockReturnValue(null);
    mocks.firebaseSignIn.mockResolvedValue({ user: { getIdToken: async () => 'firebase-token' } });
    mocks.signIn.mockRejectedValue(new Error('Invalid credentials'));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => {
      await expect(snapshot.signInWithEmail('alice@example.test', 'password')).rejects.toThrow('Invalid credentials');
    });
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(mocks.firebaseSignOut).not.toHaveBeenCalled();
    expect(snapshot.isAuthenticated).toBe(false);
  });

  it('signs out a mismatched Firebase identity after backend sign-in', async () => {
    mocks.getSessionId.mockReturnValue(null);
    mocks.firebaseSignIn.mockRejectedValue(new Error('Firebase unavailable'));
    mocks.auth.currentUser = { email: 'other@example.test' };
    mocks.signIn.mockResolvedValue({ user: { id: 'local-a', email: 'alice@example.test' }, profile: null, gamification: null, settings: null });
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => { await snapshot.signInWithEmail('alice@example.test', 'password'); });
    expect(mocks.firebaseSignOut).toHaveBeenCalledOnce();
    expect(snapshot.isAuthenticated).toBe(true);
  });

  it('does not clear a newer session when an old refresh finishes late', async () => {
    let sessionId = '1:old-user';
    mocks.getSessionId.mockImplementation(() => sessionId);
    let reject!: (error: Error) => void;
    mocks.getMe.mockReturnValue(new Promise((_resolve, r) => { reject = r; }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    sessionId = '2:new-user';
    await act(async () => { reject(Object.assign(new Error('unauthorized'), { status: 401 })); });
    expect(mocks.clearSession).not.toHaveBeenCalled();
  });

  it('does not exchange a persisted Firebase identity when a pending redirect has no result', async () => {
    mocks.getSessionId.mockReturnValue(null);
    mocks.auth.currentUser = { email: 'alice@example.test' };
    sessionStorage.setItem('learnco_google_redirect_pending', JSON.stringify({ intent: 'signin' }));
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    expect(mocks.google).not.toHaveBeenCalled();
    expect(snapshot.isAuthenticated).toBe(false);
    expect(snapshot.authError).toMatch(/could not be completed/i);
    expect(sessionStorage.getItem('learnco_google_redirect_pending')).toBeNull();
  });
});
