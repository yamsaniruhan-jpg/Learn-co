import { adminDb } from './firebaseAdmin';
import { UserAccount, UserProfile, UserGamification, LeaderboardEntry } from '../../src/types/auth';

let isAdminDbAvailable = true;

/**
 * Service to sync local auth, profile, and leaderboard records to Firestore
 */
export class FirestoreSyncService {
  /**
   * Persist user account and credentials to Firestore
   */
  static async syncUserAccount(user: UserAccount): Promise<void> {
    if (!isAdminDbAvailable || !adminDb) return;
    try {
      await adminDb.collection('users').doc(user.id).set(
        {
          id: user.id,
          email: user.email,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          ...(user.passwordHash ? { passwordHash: user.passwordHash } : {}),
        },
        { merge: true }
      );
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('PERMISSION_DENIED') || err?.code === 7) {
        // Backend runtime environment does not have direct IAM service account permissions to cross-project Firestore.
        // Disable adminDb sync gracefully so local disk/in-memory DB handles state, and client SDK handles web sync.
        isAdminDbAvailable = false;
        return;
      }
      console.warn('[FirestoreSync] Failed to sync user account:', msg);
    }
  }

  /**
   * Persist public profile to Firestore
   */
  static async syncUserProfile(profile: UserProfile): Promise<void> {
    if (!isAdminDbAvailable || !adminDb) return;
    try {
      await adminDb.collection('public_profiles').doc(profile.userId).set(
        {
          ...profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('PERMISSION_DENIED') || err?.code === 7) {
        isAdminDbAvailable = false;
        return;
      }
      console.warn('[FirestoreSync] Failed to sync user profile:', msg);
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
    if (!isAdminDbAvailable || !adminDb) return;
    try {
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
      const msg = err?.message || String(err);
      if (msg.includes('PERMISSION_DENIED') || err?.code === 7) {
        isAdminDbAvailable = false;
        return;
      }
      console.warn('[FirestoreSync] Failed to sync leaderboard entry:', msg);
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
    if (!isAdminDbAvailable || !adminDb) return;
    Promise.allSettled([
      this.syncUserAccount(user),
      this.syncUserProfile(profile),
      this.syncLeaderboardEntry(user, profile, gamification),
    ]).catch(() => {
      // Background sync handled gracefully
    });
  }
}
