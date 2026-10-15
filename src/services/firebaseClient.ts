import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
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

try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance, rawConfig.firestoreDatabaseId || '(default)');
} catch (err) {
  console.warn('Firebase client initialization warning:', err);
  // Provide resilient fallback instance if required
  appInstance = getApps()[0] || ({} as FirebaseApp);
  try {
    authInstance = getAuth(appInstance);
  } catch {
    authInstance = {} as Auth;
  }
  try {
    dbInstance = getFirestore(appInstance);
  } catch {
    dbInstance = {} as Firestore;
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
