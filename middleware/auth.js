const admin = require('../server/services/firebaseAdminCompat.cjs');

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

async function resolveUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken || idToken === 'null' || idToken === 'undefined') {
    return null;
  }

  const localUser = resolveLocalSession(idToken);
  if (localUser) {
    return {
      uid: localUser.id || localUser.uid,
      id: localUser.id || localUser.uid,
      email: localUser.email || '',
      subscription: localUser.subscription || 'free',
      authProvider: localUser.authProvider || 'email',
    };
  }

  const authClient = admin.auth();
  if (!authClient) {
    return null;
  }

  const decodedToken = await authClient.verifyIdToken(idToken, false);
  return {
    uid: decodedToken.uid,
    id: decodedToken.uid,
    email: decodedToken.email || '',
    emailVerified: decodedToken.email_verified || false,
    name: decodedToken.name || '',
    picture: decodedToken.picture || '',
    subscription: decodedToken.subscription || 'free',
  };
}

async function verifyFirebaseAuth(req, res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to continue.',
        code: 'UNAUTHORIZED',
      });
    }
    req.user = user;
    req.userId = user.uid || user.id;
    return next();
  } catch (error) {
    console.warn('Auth error:', error.code, error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked.', code: 'TOKEN_REVOKED' });
    }

    return res.status(401).json({ error: 'Invalid or expired authentication token.', code: 'UNAUTHORIZED' });
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    if (user) {
      req.user = user;
      req.userId = user.uid || user.id;
    } else {
      req.user = null;
      req.userId = null;
    }
  } catch {
    req.user = null;
    req.userId = null;
  }
  next();
}

module.exports = { verifyFirebaseAuth, optionalAuth, auth: verifyFirebaseAuth, setSessionResolver };
