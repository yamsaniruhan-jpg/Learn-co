import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  cert: vi.fn((account: unknown) => ({ account })), adc: vi.fn(() => ({ adc: true })),
  initialize: vi.fn(() => ({ name: 'mock-app' })),
}));
vi.mock('firebase-admin/app', () => ({
  cert: m.cert, applicationDefault: m.adc, initializeApp: m.initialize, getApps: () => [], getApp: vi.fn(),
}));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({}) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({}) }));

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.stubEnv('FIREBASE_ADMIN_DISABLED', 'false'); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Firebase Admin credential selection', () => {
  it('uses an explicit service account rather than unrelated default credentials', async () => {
    const account = { project_id: 'test-project', client_email: 'test@example.test', private_key: 'not-a-real-key' };
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', JSON.stringify(account));
    await import('../server/services/firebaseAdmin');
    expect(m.cert).toHaveBeenCalledWith(account);
    expect(m.adc).not.toHaveBeenCalled();
    expect(m.initialize).toHaveBeenCalledWith(expect.objectContaining({ credential: { account } }));
  });
  it('does not fall back to default credentials or log malformed account data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', '{malformed-private-data');
    const result = await import('../server/services/firebaseAdmin');
    expect(result.adminAuth).toBeNull();
    expect(m.adc).not.toHaveBeenCalled();
    expect(m.initialize).not.toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).not.toContain('malformed-private-data');
  });

  it('initializes auth-only verifier using projectId when GCP credentials are absent', async () => {
    vi.stubEnv('K_SERVICE', '');
    vi.stubEnv('K_REVISION', '');
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '');
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', '');
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '');
    vi.stubEnv('FIREBASE_CONFIG', '');
    vi.stubEnv('GCLOUD_PROJECT', '');
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', '');
    const result = await import('../server/services/firebaseAdmin');
    expect(m.adc).not.toHaveBeenCalled();
    expect(m.initialize).toHaveBeenCalledWith(expect.objectContaining({ projectId: expect.any(String) }));
    expect(result.adminAuth).not.toBeNull();
    expect(result.adminDb).toBeNull();
  });

  it('keeps both adminAuth and adminDb null when FIREBASE_ADMIN_DISABLED=true', async () => {
    vi.stubEnv('FIREBASE_ADMIN_DISABLED', 'true');
    const result = await import('../server/services/firebaseAdmin');
    expect(result.adminAuth).toBeNull();
    expect(result.adminDb).toBeNull();
    expect(m.initialize).not.toHaveBeenCalled();
  });
});
