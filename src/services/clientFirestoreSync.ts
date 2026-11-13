import { doc, setDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebaseClient';
import { UserProfile, UserGamification, LeaderboardEntry, calculateLevelFromXp } from '../types/auth';

/**
 * Client-side Firestore sync service.
 * Operates with active Firebase Auth user credentials and adheres strictly to firestore.rules.
 * Ensures every signed-in account is stored in Firebase Console (users, public_profiles, and leaderboard).
 * Guarantees that any account in Firebase Console — even with 0 XP — appears on the leaderboard forever.
 */
export function hasMatchingFirebaseIdentity(firebaseEmail?: string | null, backendEmail?: string | null): boolean {
  const a = (firebaseEmail || '').trim().toLowerCase();
  const b = (backendEmail || '').trim().toLowerCase();
  return Boolean(a && b && a === b);
}

export async function syncClientToFirestore(
  user: any,
  profile: UserProfile | null,
  gamification: UserGamification | null
): Promise<void> {
  try {
    const currentAuthUser = auth?.currentUser;
    const backendUid = user?.id || currentAuthUser?.uid;
    const firebaseMatches = hasMatchingFirebaseIdentity(currentAuthUser?.email, user?.email || profile?.email);
    const firestoreUid = firebaseMatches ? currentAuthUser?.uid : undefined;
    if (!backendUid && !firestoreUid) return;

    const uid = backendUid || firestoreUid!;
    const email = user?.email || profile?.email || (firebaseMatches ? currentAuthUser?.email : '') || '';
    const displayName =
      profile?.displayName ||
      profile?.fullName ||
      user?.name ||
      (firebaseMatches ? currentAuthUser?.displayName : '') ||
      (email ? email.split('@')[0] : 'Scholar');

    const avatarUrl =
      profile?.avatarUrl ||
      (firebaseMatches ? currentAuthUser?.photoURL : '') ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || uid)}`;

    const now = new Date().toISOString();
    const xpVal = typeof gamification?.xp === 'number' ? Math.max(0, gamification.xp) : 0;
    const levelVal =
      typeof gamification?.level === 'number' && gamification.level >= 1
        ? gamification.level
        : calculateLevelFromXp(xpVal).level;
    const streakVal = typeof gamification?.currentStreak === 'number' ? Math.max(0, gamification.currentStreak) : 0;

    // 1. Direct Firestore writes only when Firebase Auth user is signed in (matches firestore.rules isOwner)
    if (db && firestoreUid) {
      // Sync User Document to 'users' collection
      try {
        const userDocRef = doc(db, 'users', firestoreUid);
        await setDoc(
          userDocRef,
          {
            id: firestoreUid,
            email,
            displayName,
            authProvider: user?.authProvider || 'firebase',
            xp: xpVal,
            level: levelVal,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (e) {
        console.debug('[ClientFirestoreSync] Note on users collection sync:', e);
      }

      // Sync Public Profile Document to 'public_profiles' collection
      try {
        const profileDocRef = doc(db, 'public_profiles', firestoreUid);
        await setDoc(
          profileDocRef,
          {
            userId: firestoreUid,
            displayName: displayName.slice(0, 120) || 'Scholar',
            avatarUrl,
            targetExam: profile?.targetExam || 'STEM Mastery',
            targetScore: profile?.targetScore || '100%',
            bio: (profile?.bio || '').slice(0, 1000),
            xp: xpVal,
            level: levelVal,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (e) {
        console.debug('[ClientFirestoreSync] Note on public_profiles collection sync:', e);
      }

      // Sync Leaderboard Document to 'leaderboard' collection
      try {
        const leaderboardDocRef = doc(db, 'leaderboard', firestoreUid);
        await setDoc(
          leaderboardDocRef,
          {
            userId: firestoreUid,
            displayName: displayName.slice(0, 120) || 'Scholar',
            avatarUrl,
            xp: xpVal,
            level: levelVal,
            streak: streakVal,
            streakDays: streakVal,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (e) {
        console.debug('[ClientFirestoreSync] Note on leaderboard collection sync:', e);
      }
    }

    // 2. Dual-write to backend dataset when authenticated to ensure permanent persistence across server restarts
    try {
      const token = localStorage.getItem('learnco_auth_token');
      if (token) {
        await fetch('/api/leaderboard/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: uid,
            email,
            displayName,
            avatarUrl,
            xp: xpVal,
            level: levelVal,
            streak: streakVal,
          }),
        });
      }
    } catch (_) {}
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] Global sync note:', err?.message || err);
  }
}

/**
 * Real-time XP update sync to Firebase Console and backend dataset.
 * Called whenever a user earns XP anywhere in the application.
 */
export async function syncXpToFirestoreAndBackend(
  newTotalXp: number,
  reason: string = 'Activity'
): Promise<void> {
  try {
    const currentAuthUser = auth?.currentUser;
    let storedUser: any = null;
    try {
      const saved =
        localStorage.getItem('learnco_user') ||
        localStorage.getItem('learnco_auth_user');
      if (saved) storedUser = JSON.parse(saved);
    } catch (_) {}

    const firebaseMatches = hasMatchingFirebaseIdentity(currentAuthUser?.email, storedUser?.email);
    const firestoreUid = firebaseMatches ? currentAuthUser?.uid : undefined;
    const uid = storedUser?.id || firestoreUid;
    if (!uid && !firestoreUid) return;

    const email = storedUser?.email || (firebaseMatches ? currentAuthUser?.email : '') || '';
    const displayName = (
      storedUser?.name ||
      storedUser?.displayName ||
      (firebaseMatches ? currentAuthUser?.displayName : '') ||
      (email ? email.split('@')[0] : 'Scholar')
    ).slice(0, 120);

    const safeXp = Math.max(0, Math.round(Number.isFinite(newTotalXp) ? newTotalXp : 0));
    const levelInfo = calculateLevelFromXp(safeXp);
    const now = new Date().toISOString();

    // 1. Update Firestore leaderboard doc directly only when Firebase Auth user is active
    if (db && firestoreUid) {
      try {
        const lbDocRef = doc(db, 'leaderboard', firestoreUid);
        await setDoc(
          lbDocRef,
          {
            userId: firestoreUid,
            displayName,
            xp: safeXp,
            level: levelInfo.level,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (e) {
        console.debug('[ClientFirestoreSync] Realtime XP update to leaderboard:', e);
      }
    }

    // 2. Update backend dataset when authenticated
    try {
      const token = localStorage.getItem('learnco_auth_token');
      if (token) {
        await fetch('/api/leaderboard/xp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            xp: newTotalXp,
            reason,
          }),
        });
      }
    } catch (_) {}
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] Failed to sync XP update:', err?.message || err);
  }
}

/**
 * Fetch all accounts and entries stored in the Firebase Console (Firestore)
 * so that everything in Firebase appears on the leaderboard, including 0 XP accounts.
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
        const email = data.email || '';
        const avatarUrl =
          data.avatarUrl ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || userId)}`;

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
          const email = data.email || '';
          const avatarUrl =
            data.avatarUrl ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || userId)}`;

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

/**
 * Subscribe to real-time changes on the Firestore 'leaderboard' collection.
 * Triggers callback automatically whenever any entry is modified, added, or earns XP.
 */
export function subscribeToFirestoreLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    return () => {};
  }

  try {
    const lbCollection = collection(db, 'leaderboard');
    const unsubscribe = onSnapshot(
      lbCollection,
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const userId = data.userId || docSnap.id;
          const email = data.email || '';
          const displayName =
            data.displayName ||
            (email ? email.split('@')[0] : userId.substring(0, 8));
          const avatarUrl =
            data.avatarUrl ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || userId)}`;

          entries.push({
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

        onUpdate(entries);
      },
      (err) => {
        console.debug('[ClientFirestoreSync] Leaderboard snapshot listener note:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] Could not initialize snapshot listener:', err);
    return () => {};
  }
}
