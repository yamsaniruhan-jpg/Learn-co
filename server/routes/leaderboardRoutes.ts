import { Router, Response } from 'express';
import { Database } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/leaderboard
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check optional token if user is signed in to mark isCurrentUser
    let currentUserId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const user = Database.getSessionUser(token);
      if (user) currentUserId = user.id;
    }

    const { timeframe, subject } = req.query; // 'daily', 'weekly', 'monthly', 'all_time'
    const leaderboard = Database.getLeaderboard(
      currentUserId,
      typeof timeframe === 'string' ? timeframe : 'all_time',
      typeof subject === 'string' ? subject : undefined
    );

    res.json({
      timeframe: timeframe || 'all_time',
      subject: subject || 'all',
      leaderboard,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch leaderboard.' });
  }
});

// POST /api/leaderboard/xp - Update user XP and propagate to Firestore
router.post('/xp', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, xp, reason } = req.body;
    let targetUserId = userId;

    if (!targetUserId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const user = Database.getSessionUser(token);
        if (user) targetUserId = user.id;
      }
    }

    if (!targetUserId) {
      res.status(400).json({ error: 'User ID is required to award XP.' });
      return;
    }

    const updated = Database.updateUserXp(targetUserId, typeof xp === 'number' ? xp : 0, reason);
    res.json({ success: true, ...updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user XP.' });
  }
});

// POST /api/leaderboard/sync - Enroll or sync user in leaderboard
router.post('/sync', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, email, displayName, avatarUrl, xp, level, streak } = req.body;
    if (!userId && !email) {
      res.status(400).json({ error: 'User ID or email is required.' });
      return;
    }

    const id = userId || `user-${Date.now()}`;
    const user = Database.findUserById(id) || Database.findUserByEmail(email);

    if (user) {
      if (typeof xp === 'number') {
        Database.updateUserXp(user.id, xp, 'Sync');
      }
    }

    res.json({ success: true, message: 'User synchronized with leaderboard dataset.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync leaderboard.' });
  }
});

export default router;
