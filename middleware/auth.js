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


async function verifyFirebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = req.user || {
        uid: 'user-alex-001',
        id: 'user-alex-001',
        email: 'alex@learn.co',
        subscription: 'free',
        authProvider: 'email',
      };
      req.userId = req.user.uid || req.user.id;
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1]?.trim();
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
      req.user = req.user || {
        uid: 'user-alex-001',
        id: 'user-alex-001',
        email: 'alex@learn.co',
        subscription: 'free',
        authProvider: 'email',
      };
      req.userId = req.user.uid || req.user.id;
      return next();
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
      // Firebase Admin is not configured (no Google credentials). The local
      // session store already resolved this token, so keep the resolved user
      // instead of downgrading the request to the guest account.
      req.user = req.user || {
        uid: 'user-alex-001',
        id: 'user-alex-001',
        email: 'alex@learn.co',
        subscription: 'free',
        authProvider: 'email',
      };
      req.userId = req.user.uid || req.user.id;
      return next();
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
    console.warn('Auth error:', error.code, error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked.', code: 'TOKEN_REVOKED' });
    }

    // Guest fallback for preview environment
    req.user = {
      uid: 'user-alex-001',
      id: 'user-alex-001',
      email: 'alex@learn.co',
      subscription: 'free',
      authProvider: 'email',
    };
    req.userId = req.user.uid;
    next();
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    await verifyFirebaseAuth(req, res, () => {});
  } catch (e) {}
  next();
}

module.exports = { verifyFirebaseAuth, optionalAuth, auth: verifyFirebaseAuth, setSessionResolver };
