// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { awardXp, getCurrentXp, setGlobalXp, syncLocalXpOnly } from '../src/utils/xpManager';

function signIn(id: string) {
  localStorage.setItem('learnco_auth_token', `token-${id}`);
  localStorage.setItem('learnco_user', JSON.stringify({ id }));
}
function signOut() {
  localStorage.removeItem('learnco_auth_token');
  localStorage.removeItem('learnco_user');
}
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe('account-scoped local activity XP', () => {
  it('retains local activity across repeated server updates without adding it to the server balance', () => {
    signIn('alice');
    expect(syncLocalXpOnly(25, 'alice')).toBe(25);
    expect(awardXp(50, 'Focus sprint').newTotal).toBe(75);
    expect(syncLocalXpOnly(30, 'alice')).toBe(80);
    expect(getCurrentXp()).toBe(80);
    expect(localStorage.getItem('learnco_xp_v2:account:alice:server')).toBe('30');
    expect(localStorage.getItem('learnco_xp_v2:account:alice:activity')).toBe('50');
    setGlobalXp(35);
    expect(getCurrentXp()).toBe(85);
  });
  it('keeps two accounts and guest activity separate, including after sign-out and sign-in', () => {
    awardXp(7, 'guest activity');
    signIn('alice'); syncLocalXpOnly(5, 'alice'); awardXp(10, 'alice activity');
    signIn('bob'); syncLocalXpOnly(20, 'bob'); awardXp(3, 'bob activity');
    expect(getCurrentXp()).toBe(23);
    signOut(); expect(getCurrentXp()).toBe(7);
    signIn('alice'); expect(getCurrentXp()).toBe(15);
    expect(getCurrentXp(0, 'bob')).toBe(23);
  });
  it('uses the validated account id even when browser identity is stale', () => {
    signIn('alice'); awardXp(8);
    expect(syncLocalXpOnly(20, 'bob')).toBe(20);
    expect(getCurrentXp()).toBe(8);
    expect(getCurrentXp(0, 'bob')).toBe(20);
  });
  it('does not assign unowned legacy XP or logs to a newly signed-in user', () => {
    localStorage.setItem('learnco_user_xp', '400');
    localStorage.setItem('learnco_xp_transactions_log', '[{"reason":"old"}]');
    signIn('alice');
    expect(getCurrentXp()).toBe(0);
    expect(syncLocalXpOnly(5, 'alice')).toBe(5);
    expect(localStorage.getItem('learnco_user_xp')).toBe('400');
    expect(localStorage.getItem('learnco_xp_transactions_log')).toContain('old');
  });
  it('ignores malformed, negative and non-finite values and tolerates blocked storage', () => {
    signIn('alice');
    expect(awardXp(NaN).newTotal).toBe(0);
    localStorage.setItem('learnco_xp_v2:account:alice:activity', '-10');
    expect(syncLocalXpOnly(Infinity, 'alice')).toBe(0);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(getCurrentXp(12)).toBe(12);
    expect(syncLocalXpOnly(9, 'alice')).toBe(9);
  });
});
