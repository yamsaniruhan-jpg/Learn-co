// routes/learning.js
const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const progressService = require('../services/progressService');

router.post('/progress/:courseId/lesson/:lessonId', verifyFirebaseAuth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    await progressService.updateProgress(req.user.uid, courseId, lessonId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

router.get('/progress', verifyFirebaseAuth, async (req, res) => {
  try {
    const admin = require('firebase-admin');
    const snap = await admin.firestore()
      .collection('users').doc(req.user.uid)
      .collection('progress')
      .get();
    const progress = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

router.get('/review-cards', verifyFirebaseAuth, async (req, res) => {
  try {
    const cards = await progressService.getDueCards(req.user.uid);
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review cards.' });
  }
});

router.post('/review-cards/:cardId', verifyFirebaseAuth, async (req, res) => {
  try {
    await progressService.reviewCard(req.user.uid, req.params.cardId, req.body.quality);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

router.get('/weaknesses', verifyFirebaseAuth, async (req, res) => {
  try {
    const analysis = await progressService.analyzeWeaknesses(req.user.uid);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze.' });
  }
});

module.exports = router;
