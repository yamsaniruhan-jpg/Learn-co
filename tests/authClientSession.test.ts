// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient } from '../src/services/authClient';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('client session integrity', () => {
  it.each(['signin', 'signup', 'google', 'reset'] as const)('rejects incomplete successful %s responses', async (kind) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'token' }) }));
    const operation = kind === 'signin' ? AuthClient.signIn('a@example.test', 'Password1')
      : kind === 'signup' ? AuthClient.signUp({ email: 'a@example.test', password: 'Password1' })
      : kind === 'google' ? AuthClient.signInWithGoogle({ email: 'a@example.test', idToken: 'google' })
      : AuthClient.resetPassword('reset', 'Password1');
    await expect(operation).rejects.toThrow(/invalid sign-in response/i);
    expect(AuthClient.getToken()).toBeNull();
  });

  it('does not restore a session after sign-out while sign-in is pending', async () => {
    let finish!: (value: any) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise(resolve => { finish = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const pending = AuthClient.signIn('alice@example.test', 'Password1');
    await AuthClient.signOut();
    finish({ ok: true, json: async () => ({ token: 'old-token', user: { id: 'alice' } }) });
    await expect(pending).rejects.toThrow(/session changed/i);
    expect(AuthClient.getToken()).toBeNull();
  });

  it('keeps the most recently requested sign-in when responses arrive out of order', async () => {
    const finishes: ((value: any) => void)[] = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(resolve => finishes.push(resolve))));
    const old = AuthClient.signIn('alice@example.test', 'Password1');
    const latest = AuthClient.signIn('bob@example.test', 'Password1');
    finishes[1]({ ok: true, json: async () => ({ token: 'bob-token', user: { id: 'bob' } }) });
    await latest;
    finishes[0]({ ok: true, json: async () => ({ token: 'alice-token', user: { id: 'alice' } }) });
    await expect(old).rejects.toThrow(/session changed/i);
    expect(AuthClient.getToken()).toBe('bob-token');
    expect(AuthClient.getCurrentUser().id).toBe('bob');
  });

  it('clears the browser immediately and does not erase a newer session when revocation finishes', async () => {
    let finish!: () => void;
    const pending = new Promise(resolve => { finish = () => resolve({ ok: true }); });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal('fetch', fetchMock);
    AuthClient.setToken('old');
    AuthClient.setCurrentUser({ id: 'old-user' });
    const signout = AuthClient.signOut();
    expect(AuthClient.getToken()).toBeNull();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer old');
    AuthClient.setToken('new');
    AuthClient.setCurrentUser({ id: 'new-user' });
    finish();
    await signout;
    expect(AuthClient.getToken()).toBe('new');
    expect(AuthClient.getCurrentUser().id).toBe('new-user');
  });
});
