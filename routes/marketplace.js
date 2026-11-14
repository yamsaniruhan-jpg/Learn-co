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

router.get('/enrollments', verifyFirebaseAuth, async (req, res) => {
  try {
    const enrolledCourseIds = await marketplace.getUserEnrollments(req.user.uid);
    res.json({ enrolledCourseIds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load enrollments.' });
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
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5.' });
    }
    const review = await marketplace.submitReview(
      req.user.uid,
      req.user.name || req.user.email?.split('@')[0] || 'Scholar',
      req.params.courseId,
      rating,
      comment
    );
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: 'Review failed.' });
  }
});

router.get('/reviews/:courseId', async (req, res) => {
  try {
    const reviews = await marketplace.getCourseReviews(req.params.courseId);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

module.exports = router;
