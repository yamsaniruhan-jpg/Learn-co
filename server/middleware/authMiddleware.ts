import { Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { UserAccount, UserRole } from '../../src/types/auth';
import { adminAuth } from '../services/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount | any;
  userId?: string;
}

const tokenCache = new Map<string, { user: UserAccount | any; expires: number }>();

async function resolveAuthenticatedUser(req: AuthenticatedRequest): Promise<UserAccount | any | null> {
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
    return sessionUser;
  }

  // 2. Check cached verified Firebase ID token
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) {
    return cached.user;
  }

  // 3. Verify Firebase ID token when Firebase Admin SDK is configured
  if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token, false);
      const uid = decodedToken.uid;
      const resolvedUser = Database.findUserById(uid) || {
        id: uid,
        uid,
        email: decodedToken.email || '',
        subscription: (decodedToken as any).subscription || 'free',
        authProvider: 'google',
      };
      tokenCache.set(token, { user: resolvedUser, expires: Date.now() + 5 * 60 * 1000 });
      return resolvedUser;
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to continue.',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  req.user = user;
  req.userId = user.id || user.uid;
  next();
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const user = await resolveAuthenticatedUser(req);
  if (user) {
    req.user = user;
    req.userId = user.id || user.uid;
  } else {
    req.user = undefined;
    req.userId = undefined;
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' });
      return;
    }
    const profile = Database.getProfile(userId);
    const email = (req.user?.email || profile?.email || '').trim().toLowerCase();
    const effectiveRole: UserRole = (
      email === 'yamsaniruhan@gmail.com'
        ? 'admin'
        : profile?.role || req.user?.role || 'student'
    ) as UserRole;
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
