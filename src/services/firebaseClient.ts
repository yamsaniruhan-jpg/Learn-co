import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const rawConfig = firebaseConfigData as any;
const apiKey = rawConfig.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || '';

const firebaseConfig = {
  apiKey,
  authDomain: rawConfig.authDomain || 'robust-virtue-62t1j.firebaseapp.com',
  projectId: rawConfig.projectId || 'robust-virtue-62t1j',
  storageBucket: rawConfig.storageBucket || 'robust-virtue-62t1j.firebasestorage.app',
  messagingSenderId: rawConfig.messagingSenderId || '645462810395',
  appId: rawConfig.appId || '1:645462810395:web:ae491364913d7a04157dbe',
  measurementId: rawConfig.measurementId || '',
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

export async function uploadUserFile(userId: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storageRef = ref(storage, `users/${userId}/sources/${Date.now()}_${safeName}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
