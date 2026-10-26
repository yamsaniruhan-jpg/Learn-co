import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth } from './firebaseClient';
import { UserProfile, UserGamification, LeaderboardEntry } from '../types/auth';

/**
 * Client-side Firestore sync service.
 * Operates with active Firebase Auth user credentials and adheres strictly to firestore.rules.
 * Ensures every signed-in account is stored in Firebase Console (users, public_profiles, and leaderboard).
 */
export async function syncClientToFirestore(
  user: any,
  profile: UserProfile | null,
  gamification: UserGamification | null
): Promise<void> {
  try {
    if (!db) return;

    const currentAuthUser = auth?.currentUser;
    const uid = user?.id || currentAuthUser?.uid;
    if (!uid) return;

    const email = currentAuthUser?.email || user?.email || '';
    const displayName =
      profile?.displayName ||
      profile?.fullName ||
      currentAuthUser?.displayName ||
      (email ? email.split('@')[0] : 'Scholar');

    const avatarUrl =
      profile?.avatarUrl ||
      currentAuthUser?.photoURL ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || uid)}`;

    const now = new Date().toISOString();

    // 1. Sync User Document to 'users' collection
    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          id: uid,
          email,
          displayName,
          authProvider: user?.authProvider || (currentAuthUser ? 'firebase' : 'email'),
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (e) {
      console.debug('[ClientFirestoreSync] Note on users collection sync:', e);
    }

    // 2. Sync Public Profile Document to 'public_profiles' collection
    try {
      const profileDocRef = doc(db, 'public_profiles', uid);
      await setDoc(
        profileDocRef,
        {
          userId: uid,
          email,
          displayName,
          avatarUrl,
          targetExam: profile?.targetExam || 'STEM Mastery',
          targetScore: profile?.targetScore || '100%',
          bio: profile?.bio || '',
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (e) {
      console.debug('[ClientFirestoreSync] Note on public_profiles collection sync:', e);
    }

    // 3. Sync Leaderboard Document to 'leaderboard' collection (keeps account in leaderboard forever)
    try {
      const leaderboardDocRef = doc(db, 'leaderboard', uid);
      await setDoc(
        leaderboardDocRef,
        {
          userId: uid,
          email,
          displayName,
          avatarUrl,
          xp: gamification?.xp ?? 0,
          level: gamification?.level ?? 1,
          streak: gamification?.currentStreak ?? 0,
          streakDays: gamification?.currentStreak ?? 0,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (e) {
      console.debug('[ClientFirestoreSync] Note on leaderboard collection sync:', e);
    }
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] Global sync note:', err?.message || err);
  }
}

/**
 * Fetch all accounts and entries stored in the Firebase Console (Firestore)
 * so that everything in Firebase appears on the leaderboard.
 */
export async function fetchFirestoreLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const entriesMap = new Map<string, LeaderboardEntry>();

  if (!db) return [];

  // Helper to safely extract string
  const getSafeName = (data: any, id: string): string => {
    if (data.displayName && data.displayName !== 'Anonymous Scholar') return data.displayName;
    if (data.fullName) return data.fullName;
    if (data.email) return data.email.split('@')[0];
    return id.substring(0, 10);
  };

  try {
    // 1. Fetch from 'leaderboard' collection
    try {
      const lbSnap = await getDocs(collection(db, 'leaderboard'));
      lbSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId || docSnap.id;
        const displayName = getSafeName(data, userId);
        const avatarUrl =
          data.avatarUrl ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.email || userId)}`;

        entriesMap.set(userId, {
          rank: 0,
          userId,
          displayName,
          avatarUrl,
          xp: typeof data.xp === 'number' ? data.xp : 0,
          level: typeof data.level === 'number' ? data.level : 1,
          streak: typeof data.streak === 'number' ? data.streak : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
        });
      });
    } catch (lbErr) {
      console.debug('[ClientFirestoreSync] Reading leaderboard collection:', lbErr);
    }

    // 2. Fetch from 'public_profiles' collection to catch any accounts not yet in leaderboard collection
    try {
      const profSnap = await getDocs(collection(db, 'public_profiles'));
      profSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId || docSnap.id;
        if (!entriesMap.has(userId)) {
          const displayName = getSafeName(data, userId);
          const avatarUrl =
            data.avatarUrl ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.email || userId)}`;

          entriesMap.set(userId, {
            rank: 0,
            userId,
            displayName,
            avatarUrl,
            xp: typeof data.xp === 'number' ? data.xp : 0,
            level: typeof data.level === 'number' ? data.level : 1,
            streak: 0,
            streakDays: 0,
          });
        }
      });
    } catch (profErr) {
      console.debug('[ClientFirestoreSync] Reading public_profiles collection:', profErr);
    }
  } catch (err) {
    console.debug('[ClientFirestoreSync] Failed to fetch Firestore entries:', err);
  }

  return Array.from(entriesMap.values());
}
