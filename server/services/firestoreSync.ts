import { adminDb } from './firebaseAdmin';
import { UserAccount, UserProfile, UserGamification, LeaderboardEntry } from '../../src/types/auth';

/**
 * Service to sync local auth, profile, and leaderboard records to Firestore
 */
export class FirestoreSyncService {
  /**
   * Persist user account and credentials to Firestore
   */
  static async syncUserAccount(user: UserAccount): Promise<void> {
    try {
      if (!adminDb) return;
      await adminDb.collection('users').doc(user.id).set(
        {
          id: user.id,
          email: user.email,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          // Store hashed password securely if email provider
          ...(user.passwordHash ? { passwordHash: user.passwordHash } : {}),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[FirestoreSync] Failed to sync user account:', err?.message || err);
    }
  }

  /**
   * Persist public profile to Firestore
   */
  static async syncUserProfile(profile: UserProfile): Promise<void> {
    try {
      if (!adminDb) return;
      await adminDb.collection('public_profiles').doc(profile.userId).set(
        {
          ...profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[FirestoreSync] Failed to sync user profile:', err?.message || err);
    }
  }

  /**
   * Persist user gamification & enrollment in the leaderboard
   */
  static async syncLeaderboardEntry(
    user: UserAccount,
    profile: UserProfile,
    gamification: UserGamification
  ): Promise<void> {
    try {
      if (!adminDb) return;
      const displayName = profile.displayName || profile.fullName || user.email.split('@')[0];
      const entry: Partial<LeaderboardEntry> = {
        userId: user.id,
        displayName,
        avatarUrl: profile.avatarUrl,
        xp: gamification.xp,
        level: gamification.level,
        streak: gamification.currentStreak,
        streakDays: gamification.currentStreak,
      };

      await adminDb.collection('leaderboard').doc(user.id).set(
        {
          ...entry,
          email: user.email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[FirestoreSync] Failed to sync leaderboard entry:', err?.message || err);
    }
  }

  /**
   * Complete bundle sync on sign-in or sign-up
   */
  static async syncUserOnAuth(
    user: UserAccount,
    profile: UserProfile,
    gamification: UserGamification
  ): Promise<void> {
    // Run in background without blocking response
    Promise.allSettled([
      this.syncUserAccount(user),
      this.syncUserProfile(profile),
      this.syncLeaderboardEntry(user, profile, gamification),
    ]).catch((e) => console.warn('[FirestoreSync] Bundle sync warning:', e));
  }
}
