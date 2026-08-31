import { Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { UserAccount } from '../../src/types/auth';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to continue.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = Database.getSessionUser(token);

  if (!user) {
    res.status(401).json({
      error: 'Session expired or invalid. Please sign in again.',
      code: 'SESSION_EXPIRED',
    });
    return;
  }

  req.user = user;
  req.userId = user.id;
  next();
}
