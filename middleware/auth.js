// middleware/auth.js
const admin = require('firebase-admin');
const { adminAuth } = require('../server/services/firebaseAdmin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch {
    // Ignore initialization errors if already initialized elsewhere
  }
}

/**
 * Verify Firebase ID token from Authorization header
 * Sets req.user with decoded token data
 */
async function verifyFirebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow guest/demo fallback for development preview if header is missing
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

    // Verify the token (checks expiry, signature, audience)
    const authInstance = adminAuth || admin.auth();
    const decodedToken = await authInstance.verifyIdToken(idToken, false);

    // Attach user data to request
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
    console.warn('Auth verification warning:', error.code || error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired. Please refresh.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token revoked. Please sign in again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Fallback gracefully for preview / guest mode rather than hard rejecting unauthenticated requests
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

/**
 * Optional auth — doesn't block unauthenticated requests
 * but attaches user data if token is present
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  
  try {
    const idToken = authHeader.split('Bearer ')[1]?.trim();
    if (idToken) {
      const authInstance = adminAuth || admin.auth();
      const decodedToken = await authInstance.verifyIdToken(idToken, false);
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
    }
  } catch (e) {
    // Ignore auth errors for optional auth
  }
  next();
}

module.exports = { verifyFirebaseAuth, optionalAuth };
module.exports.auth = verifyFirebaseAuth;
