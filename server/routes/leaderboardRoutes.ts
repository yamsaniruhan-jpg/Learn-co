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

export default router;
