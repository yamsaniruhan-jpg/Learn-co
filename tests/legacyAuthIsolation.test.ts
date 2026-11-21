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
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {}, mentors: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    await AuthClient.signOut();
    await AnalyticsClient.getDashboard();
    await MentorshipClient.getMentors();
    expect(fetchMock.mock.calls).toHaveLength(2);
    for (const [, options] of fetchMock.mock.calls) expect(options.headers.Authorization).toBeUndefined();
    // Preserve the old value rather than silently attributing or deleting it.
    expect(localStorage.getItem('auth_token')).toBe('old-unverified-token');
  });
  it('uses the active session for both clients', async () => {
    AuthClient.setToken('current-session');
    localStorage.setItem('auth_token', 'old-unverified-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {}, mentors: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    await AnalyticsClient.getDashboard();
    await MentorshipClient.getMentors();
    for (const [, options] of fetchMock.mock.calls) expect(options.headers.Authorization).toBe('Bearer current-session');
  });
});
