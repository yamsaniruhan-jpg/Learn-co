import { Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { UserAccount, UserRole } from '../../src/types/auth';
import { adminAuth } from '../services/firebaseAdmin';
import { isOwnerEmail } from '../../src/db/users';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount | any;
  userId?: string;
  verifiedOwner?: boolean;
}

type AuthIdentity = { user: UserAccount | any; verifiedOwner: boolean };
const tokenCache = new Map<string, AuthIdentity & { expires: number }>();

async function resolveAuthenticatedUser(req: AuthenticatedRequest): Promise<AuthIdentity | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  // 1. Check local session store (signed-in email or Google users)
  const sessionUser = Database.getSessionUser(token);
  if (sessionUser) {
    return { user: sessionUser, verifiedOwner: isOwnerEmail(sessionUser.email) && Database.isVerifiedOwnerSession(token) };
  }

  // 2. Check cached verified Firebase ID token
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) {
    return { user: cached.user, verifiedOwner: cached.verifiedOwner };
  }

  // 3. Verify Firebase ID token when Firebase Admin SDK is configured
  if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
    try {
      let decodedToken = await adminAuth.verifyIdToken(token, false);
      // Privileged owner identity must also pass Firebase revocation checking.
      if (isOwnerEmail(decodedToken.email)) decodedToken = await adminAuth.verifyIdToken(token, true);
      const uid = decodedToken.uid;
      const resolvedUser = Database.findUserById(uid) || {
        id: uid,
        uid,
        email: decodedToken.email || '',
        subscription: (decodedToken as any).subscription || 'free',
        authProvider: 'google',
      };
      const verifiedOwner = isOwnerEmail(decodedToken.email) && decodedToken.email_verified === true &&
        decodedToken.firebase?.sign_in_provider === 'google.com' && isOwnerEmail(resolvedUser.email);
      const expires = Math.min(Date.now() + 5 * 60 * 1000, (decodedToken.exp || 0) * 1000);
      if (!verifiedOwner && expires > Date.now()) tokenCache.set(token, { user: resolvedUser, verifiedOwner, expires });
      return { user: resolvedUser, verifiedOwner };
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const identity = await resolveAuthenticatedUser(req);
  if (!identity) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to continue.',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  req.user = identity.user;
  req.userId = identity.user.id || identity.user.uid;
  req.verifiedOwner = identity.verifiedOwner;
  next();
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const identity = await resolveAuthenticatedUser(req);
  if (identity) {
    req.user = identity.user;
    req.userId = identity.user.id || identity.user.uid;
    req.verifiedOwner = identity.verifiedOwner;
  } else {
    req.user = undefined;
    req.userId = undefined;
    req.verifiedOwner = false;
  }
  next();
}

// Owner privileges belong to a verified session, not to an email string or a
// legacy persisted role. Other administrator roles remain unchanged.
export function getEffectiveRole(req: AuthenticatedRequest): UserRole {
  const profile = req.userId ? Database.getProfile(req.userId) : null;
  const email = req.user?.email || profile?.email || '';
  if (isOwnerEmail(email)) return req.verifiedOwner ? 'admin' : 'student';
  return (profile?.role || req.user?.role || 'student') as UserRole;
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' });
      return;
    }
    const effectiveRole = getEffectiveRole(req);
    if (!allowedRoles.includes(effectiveRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action.',
        code: 'FORBIDDEN',
      });
      return;
    }
    next();
  };
}

export const verifyFirebaseAuth = requireAuth;
export default requireAuth;
