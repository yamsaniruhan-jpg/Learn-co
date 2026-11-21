import { doc, setDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebaseClient';
import { UserProfile, UserGamification, LeaderboardEntry } from '../types/auth';
import { AuthClient } from './authClient';
import { safeAvatarUrl } from '../utils/avatarSafety';

/**
 * Client-side Firestore sync service.
 * Operates with active Firebase Auth user credentials and adheres strictly to firestore.rules.
 * Best-effort sync for matching Firebase identities; network, credentials and
 * security rules can prevent writes, so this is not a durable backup.
 */
export function hasMatchingFirebaseIdentity(firebaseEmail?: string | null, backendEmail?: string | null): boolean {
  const a = (firebaseEmail || '').trim().toLowerCase();
  const b = (backendEmail || '').trim().toLowerCase();
  return Boolean(a && b && a === b);
}

export async function syncClientToFirestore(
  user: any,
  profile: UserProfile | null,
  _gamification: UserGamification | null
): Promise<void> {
  try {
    // Never let an older account's asynchronous sync run as a newer session.
    const token = AuthClient.getToken();
    const isCurrentAccount = () => Boolean(token && AuthClient.getToken() === token && AuthClient.getCurrentUser()?.id === user?.id);
    if (!isCurrentAccount()) return;
    const currentAuthUser = auth?.currentUser;
    const backendUid = user?.id || currentAuthUser?.uid;
    const firebaseMatches = hasMatchingFirebaseIdentity(currentAuthUser?.email, user?.email || profile?.email);
    const firestoreUid = firebaseMatches ? currentAuthUser?.uid : undefined;
    if (!backendUid && !firestoreUid) return;

    const uid = backendUid || firestoreUid!;
    const email = user?.email || profile?.email || (firebaseMatches ? currentAuthUser?.email : '') || '';
    const displayName = (
      profile?.displayName ||
      profile?.fullName ||
      user?.name ||
      (firebaseMatches ? currentAuthUser?.displayName : '') ||
      (email ? email.split('@')[0] : 'Scholar')
    ).trim().slice(0, 120) || 'Scholar';

    const avatarUrl = safeAvatarUrl(profile?.avatarUrl) ||
      safeAvatarUrl(firebaseMatches ? currentAuthUser?.photoURL : '') || '/logo-mark.png';

    const now = new Date().toISOString();

    // 1. Direct Firestore writes when Firebase Auth user is signed in (matches firestore.rules isOwner)
    if (db && firestoreUid) {
      // Sync User Document to 'users' collection
      try {
        const userDocRef = doc(db, 'users', firestoreUid);
        await setDoc(
          userDocRef,
          {
            id: firestoreUid,
            backendUserId: uid,
            email,
            displayName,
            fullName: profile?.fullName || displayName,
            avatarUrl,
            authProvider: user?.authProvider || 'firebase',
            targetExam: profile?.targetExam || 'STEM Mastery',
            educationLevel: profile?.educationLevel || 'Undergraduate',
            onboardingStatus: profile?.onboardingStatus || 'COMPLETED',
            lastLoginAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (e: any) {
        console.warn('[ClientFirestoreSync] users collection sync warning:', e?.message || e);
      }

      // Public profile visibility is not enforced in the cloud mirror. Do not
      // publish to it automatically; existing documents are not changed here.
    }

    // Backend profile changes are already saved through authenticated profile
    // endpoints; replaying this snapshot can overwrite a newer account/profile.
  } catch (err: any) {
    console.warn('[ClientFirestoreSync] Global sync note:', err?.message || err);
  }
}

/** Legacy callers may still invoke this function. Client-reported XP is local
 * only; it must not be written to Firestore or promoted to server XP. */
export async function syncXpToFirestoreAndBackend(
  _newTotalXp: number,
  _reason: string = 'Activity'
): Promise<void> {
  return;
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
        const avatarUrl = safeAvatarUrl(data.avatarUrl) || '/logo-mark.png';

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
          const avatarUrl = safeAvatarUrl(data.avatarUrl) || '/logo-mark.png';

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
          const avatarUrl = safeAvatarUrl(data.avatarUrl) || '/logo-mark.png';

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
