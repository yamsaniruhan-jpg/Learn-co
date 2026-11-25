// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient } from '../src/services/authClient';

beforeEach(() => {
  localStorage.clear();
  document.cookie = 'learnco_csrf=test-csrf-token-1234567890abcdef1234567890abcd; path=/';
});
afterEach(() => vi.unstubAllGlobals());

describe('client session integrity', () => {
  it.each(['signin', 'signup', 'google', 'reset'] as const)('rejects incomplete successful %s responses', async (kind) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    const operation = kind === 'signin' ? AuthClient.signIn('a@example.test', 'Password1')
      : kind === 'signup' ? AuthClient.signUp({ email: 'a@example.test', password: 'Password1' })
      : kind === 'google' ? AuthClient.signInWithGoogle({ email: 'a@example.test', idToken: 'google' })
      : AuthClient.resetPassword('reset', 'Password1');
    await expect(operation).rejects.toThrow(/invalid sign-in response/i);
    expect(AuthClient.hasSession()).toBe(false);
  });

  it('never writes auth tokens into localStorage and purges any legacy token key', async () => {
    localStorage.setItem('learnco_auth_token', 'stale-plaintext-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'alice', email: 'alice@example.test' } }),
    }));
    await AuthClient.signIn('alice@example.test', 'Password1');
    expect(localStorage.getItem('learnco_auth_token')).toBeNull();
    expect(AuthClient.hasSession()).toBe(true);
    expect(AuthClient.getCurrentUser()?.id).toBe('alice');
  });

  it('does not restore a session after sign-out while sign-in is pending', async () => {
    let finishSignIn!: (value: any) => void;
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/auth/signout') {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return new Promise(resolve => { finishSignIn = resolve; });
    });
    vi.stubGlobal('fetch', fetchMock);
    const pending = AuthClient.signIn('alice@example.test', 'Password1');
    await vi.waitFor(() => expect(finishSignIn).toBeTypeOf('function'));
    await AuthClient.signOut();
    finishSignIn({ ok: true, json: async () => ({ user: { id: 'alice' } }) });
    await expect(pending).rejects.toThrow(/session changed/i);
    expect(AuthClient.hasSession()).toBe(false);
  });

  it('keeps the most recently requested sign-in when responses arrive out of order', async () => {
    const finishes: ((value: any) => void)[] = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(resolve => finishes.push(resolve))));
    const old = AuthClient.signIn('alice@example.test', 'Password1');
    const latest = AuthClient.signIn('bob@example.test', 'Password1');
    await vi.waitFor(() => expect(finishes).toHaveLength(2));
    finishes[1]({ ok: true, json: async () => ({ user: { id: 'bob' } }) });
    await latest;
    finishes[0]({ ok: true, json: async () => ({ user: { id: 'alice' } }) });
    await expect(old).rejects.toThrow(/session changed/i);
    expect(AuthClient.getCurrentUser().id).toBe('bob');
  });

  it('clears the browser immediately and uses credentials+CSRF headers on sign-out', async () => {
    let finish!: () => void;
    const pending = new Promise(resolve => { finish = () => resolve({ ok: true }); });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal('fetch', fetchMock);
    AuthClient.setCurrentUser({ id: 'old-user' });
    const signout = AuthClient.signOut();
    expect(AuthClient.hasSession()).toBe(false);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
    expect(fetchMock.mock.calls[0][1].headers['X-CSRF-Token']).toBe('test-csrf-token-1234567890abcdef1234567890abcd');
    AuthClient.setCurrentUser({ id: 'new-user' });
    finish();
    await signout;
    expect(AuthClient.getCurrentUser().id).toBe('new-user');
  });
});

