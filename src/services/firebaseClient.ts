import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
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

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const googleProvider = new GoogleAuthProvider();
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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
  signOut,
};
