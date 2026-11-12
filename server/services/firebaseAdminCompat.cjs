// server/services/firebaseAdminCompat.js
//
// Compatibility layer for the legacy CommonJS modules (routes/, services/,
// controllers/, middleware/) that were written against the `firebase-admin` v8
// namespace API (`admin.apps`, `admin.app()`, `admin.firestore()`,
// `admin.firestore.FieldValue`, `admin.credential.applicationDefault()`).
//
// `firebase-admin` v14 removed that namespace in favour of the modular API
// (`getApps()`, `getApp()`, `getFirestore()`, `FieldValue`, ...). Requiring the
// package directly from those files therefore crashed at import time with:
//   TypeError: Cannot read properties of undefined (reading 'length')
//
// This module exposes the old surface backed by the modular API so the existing
// modules keep working unchanged, and centralises app/database initialisation.
// When Google credentials are unavailable the admin app is not initialised at
// all, so callers transparently fall back to the local JSON store.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  initializeApp,
  getApps,
  getApp,
  applicationDefault,
} = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

let appletConfig = {};
try {
  appletConfig = require('../../firebase-applet-config.json');
} catch {
  appletConfig = {};
}

const projectId =
  process.env.FIREBASE_PROJECT_ID || appletConfig.projectId || 'learn-co';
const databaseId =
  process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || undefined;

function hasGoogleCredentials() {
  if (process.env.FIREBASE_ADMIN_DISABLED === 'true') return false;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return true;
  if (process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) return true;
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
  try {
    return fs.existsSync(
      path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json')
    );
  } catch {
    return false;
  }
}

/**
 * Initialise the default admin app exactly once, and only when credentials can
 * be resolved. Booting without Firestore keeps the process alive; every caller
 * already handles a `null` database by using the local JSON store instead.
 */
function initAdminApp() {
  if (getApps().length > 0) return getApp();
  if (!hasGoogleCredentials()) return null;

  try {
    return initializeApp({ credential: applicationDefault(), projectId });
  } catch (err) {
    try {
      return initializeApp({ projectId });
    } catch (fallbackErr) {
      if (getApps().length > 0) return getApp();
      console.warn('[FirebaseAdminCompat] Initialisation skipped:', fallbackErr?.message || fallbackErr);
      return null;
    }
  }
}

let adminApp = initAdminApp();

function getAppOrInit() {
  if (adminApp) return adminApp;
  adminApp = initAdminApp();
  return adminApp;
}

/**
 * Legacy `admin.firestore()` signature. Returns `null` when Firestore is not
 * configured, which every legacy caller already guards against.
 */
function firestore(database) {
  const app = getAppOrInit();
  if (!app) return null;
  try {
    return database || databaseId
      ? getFirestore(app, database || databaseId)
      : getFirestore(app);
  } catch (err) {
    console.warn('[FirebaseAdminCompat] Firestore unavailable:', err?.message || err);
    return null;
  }
}
firestore.FieldValue = FieldValue;
firestore.Timestamp = Timestamp;

const compat = {
  initializeApp,
  getApps,
  getApp,
  applicationDefault,
  credential: { applicationDefault },
  app: () => getAppOrInit(),
  firestore,
  auth: () => {
    const app = getAppOrInit();
    return app ? getAuth(app) : null;
  },
  FieldValue,
  Timestamp,
};

// `admin.apps` is always read as a live array (`admin.apps.length`), so expose
// it through a getter rather than freezing a snapshot at require time.
Object.defineProperty(compat, 'apps', {
  enumerable: true,
  get: () => getApps(),
});

module.exports = compat;
module.exports.default = compat;
