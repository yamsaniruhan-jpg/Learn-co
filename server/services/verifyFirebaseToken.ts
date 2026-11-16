import type { Auth, DecodedIdToken } from 'firebase-admin/auth';

let warnedRevocationFallback = false;

/**
 * Verifies a Firebase ID token with revocation checking enabled first.
 * When running in managed preview runtimes where Application Default Credentials
 * belong to a different host GCP project and lack cross-project Identity Toolkit
 * API access (returning `auth/internal-error` for `identitytoolkit.googleapis.com`),
 * falls back to cryptographic JWKS signature + audience + expiration verification
 * (`checkRevoked = false`) rather than rejecting valid Google OAuth logins.
 *
 * Explicit token rejections (`auth/id-token-revoked`, expired/invalid signatures,
 * or test rejections) are always rethrown.
 */
export async function verifyFirebaseIdTokenSafely(
  adminAuth: Pick<Auth, 'verifyIdToken'>,
  idToken: string,
  checkRevoked = true
): Promise<DecodedIdToken> {
  try {
    return await adminAuth.verifyIdToken(idToken, checkRevoked);
  } catch (err: any) {
    const code = err?.code || '';
    const msg = err?.message || String(err || '');

    // Explicit token rejection errors must never be bypassed by fallback
    const isExplicitTokenRejection =
      code === 'auth/id-token-revoked' ||
      code === 'auth/user-disabled' ||
      code === 'auth/id-token-expired' ||
      code === 'auth/argument-error' ||
      /revoked|disabled|expired|invalid signature|argument-error|malformed/i.test(msg);

    if (checkRevoked && !isExplicitTokenRejection) {
      if (!warnedRevocationFallback) {
        warnedRevocationFallback = true;
        console.warn(
          '[FirebaseAdmin] Identity Toolkit revocation lookup unavailable or restricted for current runtime credentials; verifying cryptographic JWT signature without revocation RPC:',
          msg
        );
      }
      return await adminAuth.verifyIdToken(idToken, false);
    }

    throw err;
  }
}
