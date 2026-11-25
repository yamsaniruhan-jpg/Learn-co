import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initializeApp: vi.fn((config: any) => ({ name: 'test', options: config })),
  getAuth: vi.fn((app: any) => { if (!app.name) throw new Error('No app'); return { app }; }),
  getFirestore: vi.fn(() => ({})),
  addScope: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: mocks.initializeApp, getApps: () => [], getApp: vi.fn() }));
vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuth,
  GoogleAuthProvider: class { addScope(scope: string) { mocks.addScope(scope); } setCustomParameters() {} },
  signInWithPopup: vi.fn(), signInWithRedirect: vi.fn(), getRedirectResult: vi.fn(),
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(), signOut: vi.fn(), onAuthStateChanged: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({ getFirestore: mocks.getFirestore, doc: vi.fn(), getDocFromServer: vi.fn() }));
vi.mock('firebase/storage', () => ({ getStorage: vi.fn(() => ({})), ref: vi.fn(), uploadBytesResumable: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  for (const name of ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MEASUREMENT_ID', 'VITE_FIRESTORE_DATABASE_ID']) vi.stubEnv(name, '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Firebase client initialization', () => {
  it('initializes the Firebase SDK with the configured web app', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'override-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'override.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'override-project');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'override-app');
    vi.stubEnv('VITE_FIRESTORE_DATABASE_ID', 'override-db');
    const client = await import('../src/services/firebaseClient');
    expect(mocks.initializeApp).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: 'override-key', authDomain: 'override.firebaseapp.com', projectId: 'override-project', appId: 'override-app',
    }));
    expect(mocks.getFirestore).toHaveBeenCalledWith(expect.anything(), 'override-db');
    expect(client.isFirebaseConfigured()).toBe(true);
    expect(mocks.addScope.mock.calls.map(([scope]) => scope)).toEqual(['email', 'profile']);
  });

  it('does not initialize a mixed-project SDK when a core override is incomplete', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'override-project');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = await import('../src/services/firebaseClient');
    expect(mocks.initializeApp).not.toHaveBeenCalled();
    expect(client.isFirebaseConfigured()).toBe(false);
    expect(client.auth.app).toBeUndefined();
    expect(client.getFirebaseConfigurationError()).toMatch(/Incomplete Firebase client configuration/);
  });
});
