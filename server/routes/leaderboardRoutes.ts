import { Router, Response } from 'express';
import { Database } from '../db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/leaderboard
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
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

// POST /api/leaderboard/xp - Sync authenticated user's bounded XP increment
router.post('/xp', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.userId!;
    const { xp, reason } = req.body;

    if (typeof xp !== 'number' || !Number.isFinite(xp) || xp < 0) {
      res.status(400).json({ error: 'Valid non-negative numeric XP value is required.' });
      return;
    }

    const currentGam = Database.getGamification(targetUserId);
    const currentXp = currentGam?.xp ?? 0;
    // Prevent arbitrary client-side XP inflation: allow at most +50 XP delta per direct sync call
    const boundedXp = Math.max(currentXp, Math.min(xp, currentXp + 50));

    const updated = Database.updateUserXp(targetUserId, boundedXp, typeof reason === 'string' ? reason : 'Activity');
    res.json({ success: true, ...updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user XP.' });
  }
});

// POST /api/leaderboard/sync - Synchronize authenticated user with leaderboard dataset
router.post('/sync', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.userId!;
    const profile = Database.getProfile(targetUserId);
    const { displayName, avatarUrl } = req.body || {};

    if (profile && (typeof displayName === 'string' || typeof avatarUrl === 'string')) {
      Database.updateProfile(targetUserId, {
        ...(typeof displayName === 'string' && displayName.trim() ? { displayName: displayName.trim() } : {}),
        ...(typeof avatarUrl === 'string' && avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
      });
    }

    res.json({ success: true, message: 'User synchronized with leaderboard dataset.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync leaderboard.' });
  }
});

export default router;
