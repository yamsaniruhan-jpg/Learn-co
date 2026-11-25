import { Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { UserAccount, UserRole } from '../../src/types/auth';
import { adminAuth } from '../services/firebaseAdmin';
import { verifyFirebaseIdTokenSafely } from '../services/verifyFirebaseToken';
import { isOwnerEmail } from '../../src/db/users';
import { resolveSessionFromSql } from '../../src/db/persistence';
import { AUTH_COOKIE_NAME } from './csrf';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount | any;
  userId?: string;
  verifiedOwner?: boolean;
}

type AuthIdentity = { user: UserAccount | any; verifiedOwner: boolean };
const tokenCache = new Map<string, AuthIdentity & { expires: number }>();
const MAX_TOKEN_CACHE_ENTRIES = 1000;

function setBoundedTokenCache(token: string, entry: AuthIdentity & { expires: number }) {
  const now = Date.now();
  if (tokenCache.size >= MAX_TOKEN_CACHE_ENTRIES && !tokenCache.has(token)) {
    for (const [k, v] of tokenCache.entries()) {
      if (v.expires <= now) tokenCache.delete(k);
    }
    if (tokenCache.size >= MAX_TOKEN_CACHE_ENTRIES) {
      const oldestKey = tokenCache.keys().next().value;
      if (oldestKey !== undefined) tokenCache.delete(oldestKey);
    }
  }
  tokenCache.set(token, entry);
}

export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7).trim();
    if (headerToken && headerToken !== 'null' && headerToken !== 'undefined') {
      return headerToken;
    }
  }
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string') {
    const trimmed = cookieToken.trim();
    if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
      return trimmed;
    }
  }
  return null;
}

async function resolveAuthenticatedUser(req: AuthenticatedRequest): Promise<AuthIdentity | null> {
  const token = extractAuthToken(req);
  if (!token) {
    return null;
  }

  // 1. Check local session store (signed-in email or Google users)
  const sessionUser = Database.getSessionUser(token);
  if (sessionUser) {
    return { user: sessionUser, verifiedOwner: isOwnerEmail(sessionUser.email) && Database.isVerifiedOwnerSession(token) };
  }

  // 1b. Cloud SQL fallback for persistent bearer tokens across restarts/workers
  const sqlResolved = await resolveSessionFromSql(token);
  if (sqlResolved) {
    Database.cacheResolvedSqlIdentity({ ...sqlResolved, token });
    return {
      user: sqlResolved.user,
      verifiedOwner: isOwnerEmail(sqlResolved.user.email) && Boolean(sqlResolved.session.verifiedOwner),
    };
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
      // Privileged owner identity must also pass Firebase revocation checking when available.
      if (isOwnerEmail(decodedToken.email)) decodedToken = await verifyFirebaseIdTokenSafely(adminAuth, token, true);
      const uid = decodedToken.uid;
      const verifiedTokenEmail =
        decodedToken.email && decodedToken.email_verified ? decodedToken.email : undefined;
      const linkedUser = Object.values(Database.getDb().users || {}).find(
        (candidate) => candidate.firebaseUid === uid
      );
      const resolvedUser =
        Database.findUserById(uid) ||
        linkedUser ||
        (verifiedTokenEmail ? Database.findUserByEmail(verifiedTokenEmail) : null) || {
          id: uid,
          uid,
          email: decodedToken.email || '',
          subscription: (decodedToken as any).subscription || 'free',
          authProvider: 'google',
        };
      const verifiedOwner = isOwnerEmail(decodedToken.email) && decodedToken.email_verified === true &&
        decodedToken.firebase?.sign_in_provider === 'google.com' && isOwnerEmail(resolvedUser.email);
      const expires = Math.min(Date.now() + 5 * 60 * 1000, (decodedToken.exp || 0) * 1000);
      if (!verifiedOwner && expires > Date.now()) setBoundedTokenCache(token, { user: resolvedUser, verifiedOwner, expires });
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
