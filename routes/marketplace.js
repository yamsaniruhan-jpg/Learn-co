// routes/marketplace.js
const router = require('express').Router();
const { verifyFirebaseAuth, optionalAuth } = require('../middleware/auth');
const marketplace = require('../services/marketplaceService');

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query, subject, difficulty, sort, limit } = req.query;
    if ([query, subject, difficulty, sort, limit].some((value) => value !== undefined && typeof value !== 'string')) {
      return res.status(400).json({ error: 'Invalid search parameters.' });
    }
    const result = await marketplace.searchCourses({ query, subject, difficulty, sort, limit });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Search failed.' });
  }
});

router.get('/course/:courseId', optionalAuth, async (req, res) => {
  try {
    const uid = req.user?.uid || null;
    const result = await marketplace.getCourseDetails(req.params.courseId, uid);
    res.json(result);
  } catch (error) {
    const status = error.statusCode === 404 ? 404 : 500;
    res.status(status).json({ error: status === 404 ? error.message : 'Failed to load course curriculum.' });
  }
});

router.get('/enrollments', verifyFirebaseAuth, async (req, res) => {
  try {
    const enrolledCourseIds = await marketplace.getUserEnrollments(req.user.uid);
    res.json({ enrolledCourseIds });
  } catch {
    res.status(500).json({ error: 'Failed to load enrollments.' });
  }
});

router.get('/progress', verifyFirebaseAuth, async (req, res) => {
  try {
    const progressByCourse = await marketplace.getAllUserProgress(req.user.uid);
    res.json({ progressByCourse });
  } catch {
    res.status(500).json({ error: 'Failed to load course progress.' });
  }
});

router.post('/progress/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const { lessonId, completed, quizChoiceIndex } = req.body || {};
    if (typeof lessonId !== 'string' || !lessonId.trim() || lessonId.length > 128) {
      return res.status(400).json({ error: 'Valid lessonId is required.' });
    }
    if (quizChoiceIndex !== undefined && quizChoiceIndex !== null && (!Number.isInteger(quizChoiceIndex) || quizChoiceIndex < 0 || quizChoiceIndex > 10)) {
      return res.status(400).json({ error: 'Invalid quiz choice index.' });
    }
    const result = await marketplace.saveLessonProgress(req.user.uid, req.params.courseId, {
      lessonId: lessonId.trim(),
      completed: completed !== false,
      quizChoiceIndex: typeof quizChoiceIndex === 'number' ? quizChoiceIndex : null,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode === 404 ? 404 : 500;
    res.status(status).json({ error: status === 404 ? error.message : 'Failed to save lesson progress.' });
  }
});

router.post('/publish/:courseId', verifyFirebaseAuth, async (req, res) => {
  try {
    const data = req.body;
    if (
      !/^[A-Za-z0-9_-]{1,128}$/.test(req.params.courseId) ||
      !data ||
      typeof data.title !== 'string' ||
      !data.title.trim() ||
      data.title.length > 200 ||
      typeof data.description !== 'string' ||
      !data.description.trim() ||
      data.description.length > 5000 ||
      typeof data.subject !== 'string' ||
      !data.subject.trim() ||
      data.subject.length > 100 ||
      (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.length > 30 || data.tags.some((tag) => typeof tag !== 'string' || tag.length > 100))) ||
      (data.price !== undefined && (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0))
    ) {
      return res.status(400).json({ error: 'Invalid course details.' });
    }
    const creatorName = req.user.name || data.creatorName || req.user.email?.split('@')[0] || 'Scholar Educator';
    const course = await marketplace.publishCourse(req.user.uid, req.params.courseId, { ...data, creatorName });
    res.json({ courseId: course.id, course, success: true });
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

module.exports = router;
