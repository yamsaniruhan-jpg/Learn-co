// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient } from '../src/services/authClient';
import { AnalyticsClient } from '../src/services/analyticsClient';
import { MentorshipClient } from '../src/services/mentorshipClient';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('legacy token isolation', () => {
  it('never uses a legacy token after sign-out in analytics or mentorship', async () => {
    localStorage.setItem('auth_token', 'old-unverified-token');
    localStorage.setItem('learnco_auth_token', 'old-v2-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {}, mentors: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    await AuthClient.signOut();
    await AnalyticsClient.getDashboard();
    await MentorshipClient.getMentors();
    expect(fetchMock).toHaveBeenCalled();
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.headers?.Authorization).toBeUndefined();
      expect(options.credentials).toBe('include');
    }
    expect(localStorage.getItem('learnco_auth_token')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBe('old-unverified-token');
  });

  it('uses HttpOnly cookie credentials and CSRF header for both clients without leaking tokens', async () => {
    document.cookie = 'learnco_csrf=csrf-token-value-123; path=/';
    AuthClient.setCurrentUser({ id: 'alice', email: 'alice@example.test' });
    localStorage.setItem('auth_token', 'old-unverified-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {}, mentors: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    await AnalyticsClient.getDashboard();
    await MentorshipClient.getMentors();
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.credentials).toBe('include');
      expect(options.headers?.Authorization).toBeUndefined();
      expect(options.headers?.['X-CSRF-Token']).toBe('csrf-token-value-123');
    }
    expect(localStorage.getItem('learnco_auth_token')).toBeNull();
  });
});
