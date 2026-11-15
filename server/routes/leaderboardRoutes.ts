import { Router, Response } from 'express';
import { Database } from '../db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/leaderboard
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const { timeframe, subject } = req.query; // 'daily', 'weekly', 'monthly', 'all_time'
    const selectedTimeframe = typeof timeframe === 'string' ? timeframe : 'all_time';
    const selectedSubject = typeof subject === 'string' ? subject : 'all';
    if (!['daily', 'weekly', 'monthly', 'all_time'].includes(selectedTimeframe)) {
      res.status(400).json({ error: 'Invalid leaderboard timeframe.' });
      return;
    }
    const db = Database.getDb();
    const now = Date.now();
    const cutoff = selectedTimeframe === 'daily' ? Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
      : selectedTimeframe === 'weekly' ? now - 7 * 86400000
      : selectedTimeframe === 'monthly' ? now - 30 * 86400000 : 0;
    const totals = new Map<string, number>();
    for (const tx of db.xpTransactions) {
      const at = Date.parse(tx.timestamp);
      if (!Number.isFinite(at) || at < cutoff || at > now || !Number.isFinite(tx.amount)) continue;
      const attempt = tx.relatedAttemptId ? db.attemptsById[tx.relatedAttemptId] : undefined;
      const txSubject = attempt?.subjectId || tx.metadata?.subjectId;
      if (selectedSubject !== 'all' && txSubject !== selectedSubject) continue;
      totals.set(tx.userId, (totals.get(tx.userId) || 0) + tx.amount);
    }
    const entries = Database.getLeaderboard(currentUserId, 'all_time');
    const leaderboard = entries.map(entry => ({
      ...entry,
      // Preserve legacy all-time balances; filtered views use recorded ledger
      // entries, not fabricated fractions or question-count estimates.
      xp: selectedTimeframe === 'all_time' && selectedSubject === 'all'
        ? entry.xp : Math.max(0, totals.get(entry.userId) || 0),
    })).sort((a, b) => b.xp - a.xp).map((entry, i) => ({ ...entry, rank: i + 1 }));

    res.json({
      timeframe: timeframe || 'all_time',
      subject: subject || 'all',
      leaderboard,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch leaderboard.' });
  }
});

// Client-reported activity can remain local, but cannot mint server XP.
// Verified server-side actions are responsible for writing their own awards.
router.post('/xp', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.status(403).json({
    error: 'Client-reported XP cannot be added to the server leaderboard. Complete eligible practice to earn server XP.',
    code: 'CLIENT_XP_NOT_ACCEPTED',
  });
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
