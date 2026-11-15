// routes/marketplace.js
const router = require('express').Router();
const { verifyFirebaseAuth, optionalAuth } = require('../middleware/auth');
const marketplace = require('../services/marketplaceService');

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query, subject, difficulty, sort, limit } = req.query;
    if ([query, subject, difficulty, sort, limit].some(value => value !== undefined && typeof value !== 'string')) {
      return res.status(400).json({ error: 'Invalid search parameters.' });
    }
    const result = await marketplace.searchCourses({ query, subject, difficulty, sort, limit });
    res.json(result);
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
    const data = req.body;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(req.params.courseId) || !data ||
        typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200 ||
        typeof data.description !== 'string' || data.description.length > 5000 ||
        typeof data.subject !== 'string' || !data.subject.trim() || data.subject.length > 100 ||
        (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.length > 30 || data.tags.some(tag => typeof tag !== 'string' || tag.length > 100))) ||
        (data.price !== undefined && (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0))) {
      return res.status(400).json({ error: 'Invalid course details.' });
    }
    const courseId = await marketplace.publishCourse(req.user.uid, req.params.courseId, data);
    res.json({ courseId, success: true });
  } catch (error) {
    const status = error.statusCode === 403 || error.statusCode === 503 ? error.statusCode : 500;
    res.status(status).json({ error: status === 500 ? 'Publish failed.' : error.message });
  }
});

router.post('/enroll/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const result = await marketplace.enrollCourse(req.user.uid, req.params.courseId);
    res.json(result);
  } catch (error) {
    const status = [402, 404, 503].includes(error.statusCode) ? error.statusCode : 500;
    res.status(status).json({ error: status === 500 ? 'Enrollment failed.' : error.message });
  }
});

router.post('/review/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();
    if (comment.length > 2000) return res.status(400).json({ error: 'Review is too long.' });
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
    const status = error.statusCode === 503 ? 503 : 500;
    res.status(status).json({ error: status === 503 ? error.message : 'Review failed.' });
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
