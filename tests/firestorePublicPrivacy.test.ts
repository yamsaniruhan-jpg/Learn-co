import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ set: vi.fn(async (_collection: string, _id: string, _data: any, _options: any) => {}) }));
vi.mock('../server/services/firebaseAdmin', () => ({
  adminDb: { collection: (collection: string) => ({ doc: (id: string) => ({ set: (data: any, options: any) => mocks.set(collection, id, data, options) }) }) },
}));
import { FirestoreSyncService } from '../server/services/firestoreSync';

const user: any = { id: 'u1', email: 'alice@example.test', authProvider: 'email' };
const profile: any = { userId: 'u1', email: 'alice@example.test', displayName: 'Alice', fullName: 'Alice Example', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice%40example.test', timezone: 'Asia/Kolkata', learningGoals: ['private goal'] };
beforeEach(() => mocks.set.mockClear());

describe('Firestore privacy on authentication', () => {
  it('does not automatically publish profiles or scores when signing in', async () => {
    await FirestoreSyncService.syncUserOnAuth(user, profile, null);
    expect(mocks.set).toHaveBeenCalledTimes(1);
    expect(mocks.set.mock.calls[0][0]).toBe('users');
  });
  it('uses an explicit public profile field allowlist and removes email-based avatar URLs', async () => {
    await FirestoreSyncService.syncUserProfile(profile);
    const [, , data] = mocks.set.mock.calls[0] as any;
    expect(data).toEqual(expect.objectContaining({ userId: 'u1', displayName: 'Alice', avatarUrl: '/logo-mark.png' }));
    expect(data).not.toHaveProperty('email');
    expect(data).not.toHaveProperty('timezone');
    expect(data).not.toHaveProperty('learningGoals');
  });
  it('does not send email in newly written leaderboard fields', async () => {
    await FirestoreSyncService.syncLeaderboardEntry(user, profile, null);
    const [, , data] = mocks.set.mock.calls[0] as any;
    expect(data).not.toHaveProperty('email');
    expect(data.avatarUrl).toBe('/logo-mark.png');
  });
});
