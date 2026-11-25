// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineStorageManager } from '../src/utils/offlineStorage';

const attempt = (id: string, userId?: string) => ({
  id, userId, questionId: 'q1', subjectId: 'math', topic: 'algebra',
  userAnswer: '42', isCorrect: true, timeSpentSeconds: 12, conceptId: 'c1', hintsUsedCount: 2,
});
const accepted = (id: string, newTotalXp = 0) => ({ok:true, json:async()=>({success:true, attempt:{id}, isCorrect:true, verification:'bank', newTotalXp})});
const signIn = (user: string) => {
  localStorage.setItem('learnco_user', JSON.stringify({ id: user }));
};
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('offline practice sync', () => {
  it.each([
    {ok:true, json:async()=>{throw new Error('HTML shell')}},
    {ok:true, json:async()=>({success:false})},
    accepted('another-attempt'),
    {ok:true, json:async()=>({success:true,attempt:{id:'attempt-a'},isCorrect:true,verification:'bank'})},
  ])('retains queued attempts when a 200 response is not a valid matching acknowledgement', async response => {
    signIn('alice'); OfflineStorageManager.saveOfflineAttempt(attempt('attempt-a','alice'));
    const fetch = vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({user:{id:'alice'}})}).mockResolvedValueOnce(response);
    vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(0);
    expect(OfflineStorageManager.getPendingAttempts().map(a=>a.id)).toEqual(['attempt-a']);
  });
  it('preserves structured multi-select answers through the offline queue', async () => {
    signIn('alice');
    OfflineStorageManager.saveOfflineAttempt({...attempt('multi', 'alice'), userAnswer: ['C', 'A, B']});
    const fetch = vi.fn().mockResolvedValueOnce({ok:true, json:async()=>({user:{id:'alice'}})}).mockResolvedValueOnce(accepted('multi'));
    vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(1);
    expect(JSON.parse(fetch.mock.calls[1][1].body).selectedAnswer).toEqual(['C', 'A, B']);
  });
  it('submits only the current account’s attempts to the real practice API and retains unowned legacy items', async () => {
    signIn('alice');
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-a', 'alice'));
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-b', 'bob'));
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-legacy'));
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'alice' } }) }).mockResolvedValue(accepted('attempt-a')); vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toBe('/api/practice/submit-attempt');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ attemptId: 'attempt-a', selectedAnswer: '42', topicId: 'algebra', hintsUsedCount: 2 });
    expect(OfflineStorageManager.getPendingAttempts().map(x => x.id)).toEqual(['attempt-b', 'attempt-legacy']);
  });
  it('updates server XP without losing local activity when an offline attempt syncs', async () => {
    signIn('alice');
    localStorage.setItem('learnco_xp_v2:account:alice:activity', '20');
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-a', 'alice'));
    const events: number[] = [];
    const listener = (event: Event) => events.push((event as CustomEvent).detail.totalXp);
    window.addEventListener('learnco_xp_awarded', listener);
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'alice' } }) })
      .mockResolvedValueOnce(accepted('attempt-a', 35));
    vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(1);
    expect(localStorage.getItem('learnco_xp_v2:account:alice:server')).toBe('35');
    expect(localStorage.getItem('learnco_xp_v2:account:alice:activity')).toBe('20');
    expect(events).toEqual([55]);
    window.removeEventListener('learnco_xp_awarded', listener);
  });
  it('does not apply a late offline sync result to a different account', async () => {
    signIn('alice');
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-a', 'alice'));
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'alice' } }) })
      .mockImplementationOnce(async () => { signIn('bob'); return accepted('attempt-a', 35); });
    vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(1);
    expect(localStorage.getItem('learnco_xp_v2:account:alice:server')).toBeNull();
    expect(localStorage.getItem('learnco_xp_v2:account:bob:server')).toBeNull();
  });
  it('does not sync when the server session belongs to another account', async () => {
    signIn('alice');
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-a', 'alice'));
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: { id: 'bob' } }) });
    vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(0);
    expect(fetch).toHaveBeenCalledOnce();
    expect(OfflineStorageManager.getPendingAttempts()).toHaveLength(1);
  });
  it('preserves failed and newly queued attempts and coalesces simultaneous syncs', async () => {
    signIn('alice');
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-1', 'alice'));
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-2', 'alice'));
    let release!: (value: unknown) => void;
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'alice' } }) }).mockImplementationOnce(() => new Promise(resolve => { release = resolve; })).mockResolvedValueOnce({ ok: false });
    vi.stubGlobal('fetch', fetch);
    const one = OfflineStorageManager.syncPendingAttemptsToServer();
    const two = OfflineStorageManager.syncPendingAttemptsToServer();
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-new', 'alice'));
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    release(accepted('attempt-1'));
    expect(await one).toBe(1); expect(await two).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(OfflineStorageManager.getPendingAttempts().map(x => x.id)).toEqual(['attempt-2', 'attempt-new']);
  });
  it('stops sending remaining attempts when the session changes', async () => {
    signIn('alice');
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-1', 'alice'));
    OfflineStorageManager.saveOfflineAttempt(attempt('attempt-2', 'alice'));
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'alice' } }) }).mockImplementation(async () => { signIn('bob'); return accepted('attempt-1'); });
    vi.stubGlobal('fetch', fetch);
    expect(await OfflineStorageManager.syncPendingAttemptsToServer()).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(OfflineStorageManager.getPendingAttempts().map(x => x.id)).toEqual(['attempt-2']);
  });
});
