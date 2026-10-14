import { initializeApp, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const projectId = firebaseConfig.projectId || 'robust-virtue-62t1j';
const databaseId = firebaseConfig.firestoreDatabaseId || 'ai-studio-learnco-ea5511bf-17f5-45c1-a004-aa58035900a8';

let app: App;

if (getApps().length === 0) {
  try {
    app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch {
    app = initializeApp({
      projectId,
    });
  }
} else {
  app = getApps()[0];
}

export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app, databaseId);
