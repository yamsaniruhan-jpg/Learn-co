const admin = require('../server/services/firebaseAdminCompat.cjs');

// Injected by server.ts so this legacy router can resolve tokens issued by the
// application's own session store (/api/auth/signin) instead of treating every
// non-Firebase token as a guest.
let sessionResolver = null;

function setSessionResolver(resolver) {
  sessionResolver = typeof resolver === 'function' ? resolver : null;
}

function resolveLocalSession(token) {
  if (!sessionResolver || !token) return null;
  try {
    return sessionResolver(token) || null;
  } catch (err) {
    console.warn('Local session resolution failed:', err && err.message ? err.message : err);
    return null;
  }
}

function unauthorized(res, code, error) {
  return res.status(401).json({ success: false, error, code });
}

/**
 * Strict authentication guard for the legacy routers.
 *
 * Resolves a bearer token against the application session store first, then
 * Firebase Admin (when configured). Never falls back to a default account:
 * earlier versions handed out a seeded user to anonymous callers, which allowed
 * unauthenticated reads and writes against real user data.
 */
async function verifyFirebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'UNAUTHENTICATED', 'Authentication required. Please sign in to continue.');
    }

    const idToken = authHeader.split('Bearer ')[1]?.trim();
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
      return unauthorized(res, 'UNAUTHENTICATED', 'Authentication required. Please sign in to continue.');
    }

    // Tokens issued by /api/auth/signin|signup are validated against the
    // application session store first.
    const localUser = resolveLocalSession(idToken);
    if (localUser) {
      req.user = {
        uid: localUser.id || localUser.uid,
        id: localUser.id || localUser.uid,
        email: localUser.email || '',
        subscription: localUser.subscription || 'free',
        authProvider: localUser.authProvider || 'email',
      };
      req.userId = req.user.uid;
      return next();
    }

    const authClient = admin.auth();
    if (!authClient) {
      // Firebase Admin is not configured (no Google credentials) and the local
      // session store does not recognise this token.
      return unauthorized(res, 'INVALID_SESSION', 'Your session is invalid or has expired. Please sign in again.');
    }

    const decodedToken = await authClient.verifyIdToken(idToken, false);

    req.user = {
      uid: decodedToken.uid,
      id: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
      subscription: decodedToken.subscription || 'free',
    };
    req.userId = decodedToken.uid;

    next();
  } catch (error) {
    console.warn('Auth error:', error && error.code, error && error.message);

    if (error && error.code === 'auth/id-token-expired') {
      return unauthorized(res, 'TOKEN_EXPIRED', 'Token expired.');
    }
    if (error && error.code === 'auth/id-token-revoked') {
      return unauthorized(res, 'TOKEN_REVOKED', 'Token revoked.');
    }

    return unauthorized(res, 'INVALID_SESSION', 'Your session is invalid or has expired. Please sign in again.');
  }
}

/**
 * Optional authentication for genuinely public endpoints. Populates `req.user`
 * when a valid session is present and continues anonymously otherwise — it must
 * never impersonate a user.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken || idToken === 'null' || idToken === 'undefined') return next();

  const localUser = resolveLocalSession(idToken);
  if (localUser) {
    req.user = {
      uid: localUser.id || localUser.uid,
      id: localUser.id || localUser.uid,
      email: localUser.email || '',
      subscription: localUser.subscription || 'free',
      authProvider: localUser.authProvider || 'email',
    };
    req.userId = req.user.uid;
    return next();
  }

  try {
    const authClient = admin.auth();
    if (authClient) {
      const decodedToken = await authClient.verifyIdToken(idToken, false);
      req.user = {
        uid: decodedToken.uid,
        id: decodedToken.uid,
        email: decodedToken.email || '',
        subscription: decodedToken.subscription || 'free',
        authProvider: 'google',
      };
      req.userId = decodedToken.uid;
    }
  } catch {
    // Anonymous access remains allowed for optional-auth endpoints.
  }
  next();
}

module.exports = { verifyFirebaseAuth, optionalAuth, auth: verifyFirebaseAuth, setSessionResolver };
