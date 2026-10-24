import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebaseClient';
import { UserProfile, UserGamification } from '../types/auth';

/**
 * Client-side Firestore sync service.
 * Operates with the active Firebase Auth user credentials and adheres strictly to firestore.rules.
 */
export async function syncClientToFirestore(
  user: any,
  profile: UserProfile | null,
  gamification: UserGamification | null
): Promise<void> {
  try {
    const currentAuthUser = auth?.currentUser;
    if (!currentAuthUser || !db) return;

    const uid = currentAuthUser.uid;

    // 1. Sync User Document
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        id: uid,
        email: currentAuthUser.email || user?.email || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Sync Public Profile Document
    if (profile) {
      const profileDocRef = doc(db, 'public_profiles', uid);
      await setDoc(
        profileDocRef,
        {
          userId: uid,
          displayName: profile.displayName || profile.fullName || currentAuthUser.displayName || '',
          avatarUrl: profile.avatarUrl || currentAuthUser.photoURL || '',
          targetExam: profile.targetExam || 'STEM Mastery',
          targetScore: profile.targetScore || '100%',
          bio: profile.bio || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // 3. Sync Leaderboard Entry
    if (gamification) {
      const leaderboardDocRef = doc(db, 'leaderboard', uid);
      await setDoc(
        leaderboardDocRef,
        {
          userId: uid,
          displayName: profile?.displayName || profile?.fullName || currentAuthUser.displayName || 'Scholar',
          avatarUrl: profile?.avatarUrl || currentAuthUser.photoURL || '',
          xp: gamification.xp || 0,
          level: gamification.level || 1,
          streak: gamification.currentStreak || 0,
          streakDays: gamification.currentStreak || 0,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] Client-side sync note:', err?.message || err);
  }
}
