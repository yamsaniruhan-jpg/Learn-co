import { doc, setDoc, getDocs, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from './firebaseClient';
import { UserProfile, UserGamification, LeaderboardEntry } from '../types/auth';
import { MentorApplicationRecord, MentorProfile } from '../types/mentorship';

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
    const displayName = (
      profile?.displayName ||
      profile?.fullName ||
      user?.name ||
      (firebaseMatches ? currentAuthUser?.displayName : '') ||
      (email ? email.split('@')[0] : 'Scholar')
    ).trim().slice(0, 120) || 'Scholar';

    const avatarUrl =
      profile?.avatarUrl ||
      (firebaseMatches ? currentAuthUser?.photoURL : '') ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || uid)}`;

    const now = new Date().toISOString();
    const streakVal = Math.min(10000, typeof gamification?.currentStreak === 'number' ? Math.max(0, Math.round(gamification.currentStreak)) : 0);

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

      // Sync Public Profile Document to 'public_profiles' collection
      try {
        const profileDocRef = doc(db, 'public_profiles', firestoreUid);
        await setDoc(
          profileDocRef,
          {
            userId: firestoreUid,
            displayName,
            avatarUrl,
            targetExam: profile?.targetExam || 'STEM Mastery',
            targetScore: profile?.targetScore || '100%',
            bio: (profile?.bio || '').slice(0, 1000),
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (e: any) {
        console.warn('[ClientFirestoreSync] public_profiles collection sync warning:', e?.message || e);
      }

    }

    // Sync profile metadata with the backend. This is not a durable backup.
    try {
      const token = localStorage.getItem('learnco_auth_token') || localStorage.getItem('auth_token');
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
            streak: streakVal,
          }),
        });
      }
    } catch (_) {}
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

const PLATFORM_OWNER_EMAIL = 'yamsaniruhan@gmail.com';

export async function syncMentorApplicationToFirestore(
  app: MentorApplicationRecord
): Promise<boolean> {
  if (!db || !auth?.currentUser) return false;
  try {
    const firebaseUid = auth.currentUser.uid;
    const payload = {
      id: app.id,
      applicantUid: firebaseUid,
      backendApplicantUid: app.applicantUid,
      applicantEmail: app.applicantEmail,
      fullName: String(app.fullName || '').slice(0, 160),
      degree: app.degree,
      institution: app.institution,
      subjectId: app.subjectId,
      experienceYears: Number(app.experienceYears) || 0,
      capacity: Number(app.capacity) || 5,
      hourlyRate: Number(app.hourlyRate) || 0,
      bio: String(app.bio || '').slice(0, 4000),
      status: 'PENDING',
      routedToEmail: PLATFORM_OWNER_EMAIL,
      submittedAt: app.submittedAt,
      updatedAt: app.updatedAt,
    };
    await setDoc(doc(db, 'mentor_applications', app.id), payload);
    return true;
  } catch (err: any) {
    console.warn('[ClientFirestoreSync] mentor_applications write warning:', err?.message || err);
    return false;
  }
}

export async function fetchMyMentorApplicationsFromFirestore(): Promise<MentorApplicationRecord[]> {
  if (!db || !auth?.currentUser) return [];
  try {
    const q = query(
      collection(db, 'mentor_applications'),
      where('applicantUid', '==', auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: data.id || d.id,
        applicantUid: data.backendApplicantUid || data.applicantUid || auth.currentUser!.uid,
        applicantEmail: data.applicantEmail || '',
        fullName: data.fullName || '',
        degree: data.degree || '',
        institution: data.institution || '',
        subjectId: data.subjectId || 'math',
        experienceYears: Number(data.experienceYears) || 0,
        capacity: Number(data.capacity) || 5,
        hourlyRate: Number(data.hourlyRate) || 0,
        bio: data.bio || '',
        status: data.status || 'PENDING',
        routedToEmail: data.routedToEmail || PLATFORM_OWNER_EMAIL,
        reviewerEmail: data.reviewerEmail || null,
        reviewerNote: data.reviewerNote || null,
        reviewedAt: data.reviewedAt || null,
        submittedAt: data.submittedAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as MentorApplicationRecord;
    });
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] fetchMyMentorApplications note:', err?.message || err);
    return [];
  }
}

export async function fetchOwnerMentorApplicationsFromFirestore(): Promise<MentorApplicationRecord[]> {
  if (!db || !auth?.currentUser) return [];
  if ((auth.currentUser.email || '').trim().toLowerCase() !== PLATFORM_OWNER_EMAIL) return [];
  try {
    const snap = await getDocs(collection(db, 'mentor_applications'));
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: data.id || d.id,
        applicantUid: data.backendApplicantUid || data.applicantUid || '',
        applicantEmail: data.applicantEmail || '',
        fullName: data.fullName || '',
        degree: data.degree || '',
        institution: data.institution || '',
        subjectId: data.subjectId || 'math',
        experienceYears: Number(data.experienceYears) || 0,
        capacity: Number(data.capacity) || 5,
        hourlyRate: Number(data.hourlyRate) || 0,
        bio: data.bio || '',
        status: data.status || 'PENDING',
        routedToEmail: data.routedToEmail || PLATFORM_OWNER_EMAIL,
        reviewerEmail: data.reviewerEmail || null,
        reviewerNote: data.reviewerNote || null,
        reviewedAt: data.reviewedAt || null,
        submittedAt: data.submittedAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as MentorApplicationRecord;
    });
  } catch (err: any) {
    console.debug('[ClientFirestoreSync] fetchOwnerMentorApplications note:', err?.message || err);
    return [];
  }
}

export async function syncOwnerApplicationDecisionToFirestore(
  app: MentorApplicationRecord,
  mentorProfile?: MentorProfile | null
): Promise<boolean> {
  if (!db || !auth?.currentUser) return false;
  if ((auth.currentUser.email || '').trim().toLowerCase() !== PLATFORM_OWNER_EMAIL) return false;
  try {
    await setDoc(
      doc(db, 'mentor_applications', app.id),
      {
        status: app.status,
        reviewerEmail: app.reviewerEmail || PLATFORM_OWNER_EMAIL,
        reviewerNote: app.reviewerNote || null,
        reviewedAt: app.reviewedAt || new Date().toISOString(),
        updatedAt: app.updatedAt,
      },
      { merge: true }
    );
    if (app.status === 'APPROVED' && mentorProfile) {
      await setDoc(
        doc(db, 'mentors', mentorProfile.id),
        {
          id: mentorProfile.id,
          userId: app.applicantUid,
          email: app.applicantEmail,
          name: mentorProfile.name,
          status: 'active',
          subjects: mentorProfile.subjects,
          education: mentorProfile.education,
          rating: mentorProfile.rating,
          totalSessions: mentorProfile.sessionsCompleted,
          updatedAt: app.updatedAt,
        },
        { merge: true }
      );
    }
    return true;
  } catch (err: any) {
    console.warn('[ClientFirestoreSync] owner decision Firestore sync warning:', err?.message || err);
    return false;
  }
}
