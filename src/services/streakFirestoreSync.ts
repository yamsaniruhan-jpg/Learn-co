import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebaseClient';
import { StreakData, mergeStreakData } from '../utils/streakManager';

export async function pushStreakToFirestore(streakData: StreakData): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  const uid = auth?.currentUser?.uid;
  if (!uid) return false;

  const path = `users/${uid}/streak/summary`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'streak', 'summary'),
      {
        ...streakData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      return false;
    }
  }
}

export async function pullAndMergeStreakFromFirestore(localStreak: StreakData): Promise<StreakData> {
  if (!isFirebaseConfigured() || !db) return localStreak;
  const uid = auth?.currentUser?.uid;
  if (!uid) return localStreak;

  const path = `users/${uid}/streak/summary`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'streak', 'summary'));
    if (!snap.exists()) {
      await pushStreakToFirestore(localStreak);
      return localStreak;
    }
    const remote = snap.data() as Partial<StreakData>;
    const merged = mergeStreakData(localStreak, remote);
    if (
      merged.currentStreak !== Number(remote.currentStreak || 0) ||
      merged.streakHistory.length !== (remote.streakHistory?.length || 0)
    ) {
      await pushStreakToFirestore(merged);
    }
    return merged;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch {
      return localStreak;
    }
  }
}
