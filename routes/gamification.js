// routes/gamification.js
const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const gamification = require('../services/gamificationService');

router.get('/profile', verifyFirebaseAuth, async (req, res) => {
  try {
    const profile = await gamification.getProfile(req.user.uid);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

router.get('/leaderboard', verifyFirebaseAuth, async (req, res) => {
  try {
    const { timeframe, limit } = req.query;
    const leaderboard = await gamification.getLeaderboard(timeframe, parseInt(limit) || 20);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// XP awards are server-authoritative and must only be triggered by verified backend workflows.
router.post('/award-xp', verifyFirebaseAuth, (_req, res) => {
  res.status(403).json({
    error: 'Direct client XP awards are disabled. XP is awarded automatically by verified server actions.',
    code: 'FORBIDDEN_CLIENT_XP_AWARD',
  });
});

module.exports = router;
