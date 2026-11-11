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

// Internal endpoint — called by other services after actions
router.post('/award-xp', verifyFirebaseAuth, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const result = await gamification.awardXP(req.user.uid, action, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to award XP.' });
  }
});

module.exports = router;
