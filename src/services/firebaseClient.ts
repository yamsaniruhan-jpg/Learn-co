import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, FirebaseStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const rawConfig = (firebaseConfigData || {}) as Record<string, string | undefined>;
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: rawConfig.apiKey || env.VITE_FIREBASE_API_KEY || '',
  authDomain: rawConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: rawConfig.projectId || env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: rawConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: rawConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: rawConfig.appId || env.VITE_FIREBASE_APP_ID || '',
  measurementId: rawConfig.measurementId || env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;

try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance, rawConfig.firestoreDatabaseId || '(default)');
  storageInstance = getStorage(appInstance);
} catch (err) {
  console.warn('Firebase client initialization warning:', err);
  appInstance = getApps()[0] || ({} as FirebaseApp);
  try { authInstance = getAuth(appInstance); } catch { authInstance = {} as Auth; }
  try { dbInstance = getFirestore(appInstance); } catch { dbInstance = {} as Firestore; }
  try { storageInstance = getStorage(appInstance); } catch { storageInstance = {} as FirebaseStorage; }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && appInstance?.name);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const user = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo:
        user?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured() || !dbInstance) return false;
  try {
    await getDocFromServer(doc(dbInstance, 'gamification', 'xpRules'));
    return true;
  } catch (error: any) {
    const code = error?.code || '';
    const msg = error instanceof Error ? error.message : String(error || '');
    if (code === 'permission-denied' || /permission[- ]denied/i.test(msg)) {
      // Server responded, so Firestore network connectivity is available.
      return true;
    }
    if (msg.includes('the client is offline') || code === 'unavailable') {
      console.warn('Firestore connection check: client is offline.');
    }
    return false;
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Store the original under the authenticated Firebase UID; do not create a public
// download-token URL. A bounded upload keeps an unavailable bucket from blocking intake.
export async function uploadUserFile(userId: string, sourceId: string, file: File): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Firebase session changed.');
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storageRef = ref(storage, `users/${userId}/sources/${sourceId}/${safeName}`);
  const task = uploadBytesResumable(storageRef, file);
  const timer = setTimeout(() => task.cancel(), 15000);
  try { await task; } finally { clearTimeout(timer); }
}

export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
  signOut,
  onAuthStateChanged,
};
