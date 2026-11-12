// routes/mentorship.js
const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const mentorshipService = require('../services/mentorshipService');

router.post('/find-mentors', verifyFirebaseAuth, async (req, res) => {
  try {
    const mentors = await mentorshipService.findMentors(req.user.uid, req.body);
    res.json({ mentors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find mentors.' });
  }
});

router.post('/book-session', verifyFirebaseAuth, async (req, res) => {
  try {
    const sessionId = await mentorshipService.bookSession(req.user.uid, req.body.mentorId, req.body);
    res.status(201).json({ sessionId, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book session.' });
  }
});

router.get('/my-sessions', verifyFirebaseAuth, async (req, res) => {
  try {
    const admin = require('../server/services/firebaseAdminCompat.cjs');
    let sessions = [];

    // Returns null when Firestore is not configured; the local store is then
    // the authoritative source for booked sessions.
    const db = admin.firestore();
    if (db) {
      try {
        const snap = await db
          .collection('sessions')
          .where('learnerUid', '==', req.user.uid)
          .orderBy('date', 'desc')
          .limit(20)
          .get();
        sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Firestore fetch sessions fallback:', e.message);
      }
    }

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

module.exports = router;
