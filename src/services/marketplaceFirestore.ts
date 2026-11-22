import { doc, getDoc, getDocs, setDoc, collection } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebaseClient';
import { AuthClient } from './authClient';
import { hasMatchingFirebaseIdentity } from './clientFirestoreSync';

export interface MarketplaceCourseProgress {
  courseId: string;
  completedLessonIds: string[];
  quizResults: Record<string, { selectedIndex: number; correct: boolean; answeredAt: string }>;
  completionPercent: number;
  updatedAt: string;
}

function getAuthenticatedUid(): string | null {
  const local = AuthClient.getCurrentUser();
  const firebaseUser = auth?.currentUser;
  if (!AuthClient.getToken() || !local?.id || !firebaseUser?.emailVerified ||
      !hasMatchingFirebaseIdentity(firebaseUser.email, local.email)) return null;
  return firebaseUser.uid;
}

export async function syncCourseProgressToFirestore(
  courseId: string,
  progress: MarketplaceCourseProgress
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const uid = getAuthenticatedUid();
  if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(courseId)) return;

  const path = `users/${uid}/progress/${courseId}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'progress', courseId),
      {
        courseId,
        completedLessonIds: progress.completedLessonIds,
        quizResults: progress.quizResults,
        completionPercent: progress.completionPercent,
        updatedAt: progress.updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Non-fatal fallback: server/local storage retains progress
    }
  }
}

export async function fetchCourseProgressFromFirestore(): Promise<Record<string, MarketplaceCourseProgress>> {
  if (!isFirebaseConfigured() || !db) return {};
  const uid = getAuthenticatedUid();
  if (!uid) return {};

  const path = `users/${uid}/progress`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'progress'));
    if (getAuthenticatedUid() !== uid) return {};
    const out: Record<string, MarketplaceCourseProgress> = {};
    snap.docs.forEach((d) => {
      const data = d.data() || {};
      if (Array.isArray(data.completedLessonIds)) {
        out[d.id] = {
          courseId: d.id,
          completedLessonIds: data.completedLessonIds,
          quizResults: (data.quizResults as MarketplaceCourseProgress['quizResults']) || {},
          completionPercent: Number(data.completionPercent || 0),
          updatedAt: String(data.updatedAt || new Date().toISOString()),
        };
      }
    });
    return out;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      return {};
    }
  }
}

export async function syncPublishedCourseToFirestore(course: Record<string, any>): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const uid = getAuthenticatedUid();
  if (!uid || !course?.id || !/^[A-Za-z0-9_-]{1,128}$/.test(course.id)) return;

  const path = `marketplace/${course.id}`;
  try {
    await setDoc(
      doc(db, 'marketplace', course.id),
      {
        ...course,
        creatorUid: uid,
        status: 'published',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Non-fatal fallback
    }
  }
}

export async function fetchSingleCourseProgressFromFirestore(
  courseId: string
): Promise<MarketplaceCourseProgress | null> {
  if (!isFirebaseConfigured() || !db) return null;
  const uid = getAuthenticatedUid();
  if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(courseId)) return null;

  const path = `users/${uid}/progress/${courseId}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'progress', courseId));
    if (getAuthenticatedUid() !== uid || !snap.exists()) return null;
    const data = snap.data() || {};
    return {
      courseId,
      completedLessonIds: Array.isArray(data.completedLessonIds) ? data.completedLessonIds : [],
      quizResults: (data.quizResults as MarketplaceCourseProgress['quizResults']) || {},
      completionPercent: Number(data.completionPercent || 0),
      updatedAt: String(data.updatedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}
