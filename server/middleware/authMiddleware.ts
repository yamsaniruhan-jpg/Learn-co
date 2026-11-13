import { Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { UserAccount } from '../../src/types/auth';
import { adminAuth } from '../services/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount | any;
  userId?: string;
}

const tokenCache = new Map<string, { user: UserAccount | any, expires: number }>();

/**
 * Resolve a bearer token to a user account.
 *
 * Order matters:
 *  1. Application session store (tokens issued by /api/auth/signin|signup).
 *  2. Short-lived in-process cache for recently verified Firebase tokens.
 *  3. Firebase Admin verification, when credentials are configured.
 *
 * Returns null when the token is missing, malformed, expired or unknown. This
 * function never falls back to a default/guest account: doing so previously let
 * unauthenticated callers read and mutate a real user's records.
 */
async function resolveUserFromToken(token: string): Promise<UserAccount | any | null> {
  if (!token || token === 'null' || token === 'undefined') return null;

  const sessionUser = Database.getSessionUser(token);
  if (sessionUser) return sessionUser;

  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) return cached.user;

  if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token, false);
      const uid = decodedToken.uid;
      const user = Database.findUserById(uid) || {
        id: uid,
        uid,
        email: decodedToken.email || '',
        subscription: decodedToken.subscription || 'free',
        authProvider: 'google',
      };
      tokenCache.set(token, { user, expires: Date.now() + 5 * 60 * 1000 });
      return user;
    } catch {
      // Invalid, expired or revoked token — treated as unauthenticated.
      return null;
    }
  }

  return null;
}

/**
 * Strict authentication guard. Responds 401 unless a valid session is presented.
 *
 * Note: this intentionally does NOT grant a guest account. Endpoints mounted
 * behind `requireAuth` are user-scoped and must never operate anonymously.
 */
export async function verifyFirebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to continue.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = await resolveUserFromToken(token);

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Your session is invalid or has expired. Please sign in again.',
      code: 'INVALID_SESSION',
    });
    return;
  }

  req.user = user;
  req.userId = user.id || user.uid;
  next();
}

/**
 * Optional authentication for genuinely public endpoints (e.g. browsing the
 * marketplace). Populates `req.user` when a valid session exists and simply
 * continues as anonymous otherwise — but still never impersonates a user.
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = await resolveUserFromToken(token);
  if (user) {
    req.user = user;
    req.userId = user.id || user.uid;
  }
  next();
}

/**
 * Gate for system-administrator-only endpoints.
 *
 * Must run AFTER `verifyFirebaseAuth`, which is what populates `req.userId`.
 * The `role` field already exists on every profile (`'student' | 'educator' |
 * 'admin'`) and was previously trusted only by the UI: the "Admin Studio" tab is
 * just a React view, so any signed-in student could call the endpoints it uses
 * directly. This closes that gap server-side.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const profile = Database.getProfile(userId);
    if (!profile || profile.role !== 'admin') {
      // 404 rather than 403 so the endpoint's existence is not advertised to
      // non-admins; the request is still refused either way.
      res.status(404).json({ error: 'Not found.' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

export const requireAuth = verifyFirebaseAuth;

export default verifyFirebaseAuth;
