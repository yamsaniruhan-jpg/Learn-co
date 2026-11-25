import { describe, expect, it } from 'vitest';
import { resolveFirebaseClientConfig } from '../src/services/firebaseConfig';

const defaults = {
  apiKey: 'default-key', authDomain: 'default.firebaseapp.com', projectId: 'default', appId: 'default-app',
  storageBucket: 'default-bucket', messagingSenderId: 'default-sender', firestoreDatabaseId: 'default-named-db',
};
const alternate = {
  VITE_FIREBASE_API_KEY: 'new-key', VITE_FIREBASE_AUTH_DOMAIN: 'new.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'new-project', VITE_FIREBASE_APP_ID: 'new-app',
};

describe('Firebase client configuration', () => {
  it('uses the committed app config when no override is supplied', () => {
    const resolved = resolveFirebaseClientConfig(defaults, {});
    expect(resolved.error).toBeNull();
    expect(resolved.config).toMatchObject({ projectId: 'default', apiKey: 'default-key', authDomain: 'default.firebaseapp.com' });
    expect(resolved.firestoreDatabaseId).toBe('default-named-db');
  });

  it('uses a complete Vite override, without carrying over another project’s resources', () => {
    const resolved = resolveFirebaseClientConfig(defaults, alternate);
    expect(resolved.error).toBeNull();
    expect(resolved.config).toMatchObject({ projectId: 'new-project', apiKey: 'new-key', authDomain: 'new.firebaseapp.com', appId: 'new-app', storageBucket: '', messagingSenderId: '' });
    expect(resolved.firestoreDatabaseId).toBe('(default)');
  });

  it('rejects a partial core override instead of silently mixing projects', () => {
    const resolved = resolveFirebaseClientConfig(defaults, { VITE_FIREBASE_PROJECT_ID: 'new-project' });
    expect(resolved.error).toContain('VITE_FIREBASE_API_KEY');
    expect(resolved.error).toContain('VITE_FIREBASE_AUTH_DOMAIN');
    expect(resolved.error).toContain('VITE_FIREBASE_APP_ID');
  });

  it('allows explicit optional resources and retains the default database for the same project', () => {
    const resolved = resolveFirebaseClientConfig(defaults, {
      ...alternate, VITE_FIREBASE_PROJECT_ID: 'default', VITE_FIRESTORE_DATABASE_ID: 'chosen-db',
      VITE_FIREBASE_STORAGE_BUCKET: 'chosen-bucket',
    });
    expect(resolved.error).toBeNull();
    expect(resolved.firestoreDatabaseId).toBe('chosen-db');
    expect(resolved.config.storageBucket).toBe('chosen-bucket');
    expect(resolved.config.messagingSenderId).toBe('default-sender');
    expect(resolveFirebaseClientConfig(defaults, { ...alternate, VITE_FIREBASE_PROJECT_ID: 'default' }).firestoreDatabaseId).toBe('default-named-db');
  });
});
