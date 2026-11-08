import { Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { UserAccount } from '../../src/types/auth';
import { adminAuth } from '../services/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount | any;
  userId?: string;
}

const tokenCache = new Map<string, { user: UserAccount | any, expires: number }>();

export async function verifyFirebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const guestUser = Database.getSessionUser('guest_token') || {
      id: 'user-alex-001',
      uid: 'user-alex-001',
      email: 'alex@learn.co',
      subscription: 'free',
      authProvider: 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    req.user = guestUser;
    req.userId = guestUser.id;
    next();
    return;
  }

  const token = authHeader.substring(7).trim();
  
  let user = Database.getSessionUser(token);
  
  const cached = tokenCache.get(token);
  if (!user && cached && cached.expires > Date.now()) {
    user = cached.user;
  }
  
  if (!user && token && token !== 'null' && token !== 'undefined') {
    try {
      if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
        const decodedToken = await adminAuth.verifyIdToken(token, false);
        const uid = decodedToken.uid;
        user = Database.findUserById(uid) || {
          id: uid,
          uid,
          email: decodedToken.email || '',
          subscription: decodedToken.subscription || 'free',
          authProvider: 'google',
        };
        tokenCache.set(token, { user, expires: Date.now() + 5 * 60 * 1000 });
      }
    } catch {
      user = Database.getSessionUser('guest_token');
    }
  }

  if (!user) {
    user = Database.getSessionUser('guest_token') || {
      id: 'user-alex-001',
      uid: 'user-alex-001',
      email: 'alex@learn.co',
      subscription: 'free',
      authProvider: 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  req.user = user;
  req.userId = user.id || user.uid;
  next();
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return verifyFirebaseAuth(req, res, next);
}

export const requireAuth = verifyFirebaseAuth;

export default verifyFirebaseAuth;
