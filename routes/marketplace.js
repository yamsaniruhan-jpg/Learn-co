// routes/marketplace.js
const router = require('express').Router();
const { verifyFirebaseAuth, optionalAuth } = require('../middleware/auth');
const marketplace = require('../services/marketplaceService');

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const courses = await marketplace.searchCourses(req.query);
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: 'Search failed.' });
  }
});

router.post('/publish/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const courseId = await marketplace.publishCourse(req.user.uid, req.params.courseId, req.body);
    res.json({ courseId, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Publish failed.' });
  }
});

router.post('/enroll/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const result = await marketplace.enrollCourse(req.user.uid, req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Enrollment failed.' });
  }
});

router.post('/review/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5.' });
    await marketplace.submitReview(req.user.uid, req.user.name, req.params.courseId, rating, comment);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Review failed.' });
  }
});

router.get('/reviews/:courseId', async (req, res) => {
  try {
    const admin = require('../server/services/firebaseAdminCompat.cjs');
    // Returns null when Firestore is not configured for this environment.
    const db = admin.firestore();

    if (!db) {
      return res.json({ reviews: [] });
    }

    const snap = await db
      .collection('marketplace').doc(req.params.courseId)
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(20).get();
    res.json({ reviews: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

module.exports = router;
