type FirebaseValues = Record<string, string | undefined>;

export interface ResolvedFirebaseClientConfig {
  config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    storageBucket: string;
    messagingSenderId: string;
    measurementId: string;
  };
  firestoreDatabaseId: string;
  error: string | null;
}

/**
 * Vite's public Firebase settings are build-time configuration, not secrets.
 * Treat the core web-app settings as one unit so a partial override never
 * silently combines credentials or an auth domain from different projects.
 */
export function resolveFirebaseClientConfig(defaults: FirebaseValues, env: FirebaseValues): ResolvedFirebaseClientConfig {
  const value = (name: string) => (env[name] || '').trim();
  const coreKeys = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'] as const;
  const hasCoreOverride = coreKeys.some((key) => value(key));
  const missing = hasCoreOverride ? coreKeys.filter((key) => !value(key)) : [];
  const usingOtherProject = hasCoreOverride && value('VITE_FIREBASE_PROJECT_ID') !== defaults.projectId;
  const config = {
    apiKey: hasCoreOverride ? value('VITE_FIREBASE_API_KEY') : defaults.apiKey || '',
    authDomain: hasCoreOverride ? value('VITE_FIREBASE_AUTH_DOMAIN') : defaults.authDomain || '',
    projectId: hasCoreOverride ? value('VITE_FIREBASE_PROJECT_ID') : defaults.projectId || '',
    appId: hasCoreOverride ? value('VITE_FIREBASE_APP_ID') : defaults.appId || '',
    storageBucket: value('VITE_FIREBASE_STORAGE_BUCKET') || (usingOtherProject ? '' : defaults.storageBucket || ''),
    messagingSenderId: value('VITE_FIREBASE_MESSAGING_SENDER_ID') || (usingOtherProject ? '' : defaults.messagingSenderId || ''),
    measurementId: value('VITE_FIREBASE_MEASUREMENT_ID') || (usingOtherProject ? '' : defaults.measurementId || ''),
  };
  return {
    config,
    firestoreDatabaseId: value('VITE_FIRESTORE_DATABASE_ID') || (usingOtherProject ? '(default)' : defaults.firestoreDatabaseId || '(default)'),
    error: missing.length ? `Incomplete Firebase client configuration. Set all four core VITE_FIREBASE settings; missing: ${missing.join(', ')}.` : null,
  };
}
