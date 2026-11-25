import fs from 'fs';
import os from 'os';
import path from 'path';
import { initializeApp, getApps, getApp, applicationDefault, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'robust-virtue-62t1j';
const databaseId =
  process.env.FIRESTORE_DATABASE_ID ||
  (firebaseConfig as any).firestoreDatabaseId ||
  'ai-studio-learnco-ea5511bf-17f5-45c1-a004-aa58035900a8';

/**
 * Firebase Admin needs Google Application Default Credentials to reach
 * Firestore. When they are missing, `google-gax` rejects *inside* the gRPC
 * transport, which surfaced as an unhandled promise rejection and killed the
 * whole server process on the first Firestore-backed request.
 *
 * We therefore only wire the admin SDK up when credentials can plausibly be
 * resolved, and let the app fall back to the local JSON store otherwise.
 */
export function hasGoogleCredentials(): boolean {
  if (process.env.FIREBASE_ADMIN_DISABLED === 'true') return false;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return true;
  if (process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) return true;
  // Managed runtimes expose an internal metadata server.
  if (
    process.env.K_SERVICE ||
    process.env.K_REVISION ||
    process.env.GAE_ENV ||
    process.env.FUNCTION_TARGET ||
    process.env.GCE_METADATA_HOST ||
    process.env.CLOUD_RUN_JOB
  ) {
    return true;
  }
  // Local gcloud application-default login.
  try {
    const wellKnown = path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
    return fs.existsSync(wellKnown);
  } catch {
    return false;
  }
}

export const isFirebaseAdminConfigured = hasGoogleCredentials();
const explicitServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
const isAdminDisabled = process.env.FIREBASE_ADMIN_DISABLED === 'true';

let app: App | null = null;
let authOnlyApp: App | null = null;

if (isFirebaseAdminConfigured) {
  try {
    if (getApps().length === 0) {
      // Invalid explicit credentials must not silently fall back to another account.
      const credential = explicitServiceAccount ? cert(JSON.parse(explicitServiceAccount)) : applicationDefault();
      app = initializeApp({ credential, projectId });
    } else {
      app = getApp();
    }
  } catch {
    console.warn('[FirebaseAdmin] Initialisation skipped. Check Firebase Admin credential configuration.');
    app = null;
  }
} else if (!isAdminDisabled && !explicitServiceAccount) {
  // Public Google SecureToken JWKS verification only requires projectId (no service account/IAM).
  try {
    authOnlyApp = getApps().length === 0 ? initializeApp({ projectId }) : getApp();
  } catch {
    authOnlyApp = null;
  }
}

function createFirestore(): Firestore | null {
  if (!app) return null;
  try {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Firestore unavailable:', err?.message || err);
    return null;
  }
}

const resolvedAuthApp = app || authOnlyApp;
export const adminAuth: Auth | null = resolvedAuthApp ? getAuth(resolvedAuthApp) : null;
export const adminDb: Firestore | null = createFirestore();
export { app as firebaseAdminApp };

