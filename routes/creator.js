const router = require('express').Router();
const admin = require('../server/services/firebaseAdminCompat.cjs');
const { verifyFirebaseAuth } = require('../middleware/auth');
const { courseValidation, handleValidation } = require('../middleware/validate');

router.put('/courses/:courseId/autosave', verifyFirebaseAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const uid = req.user?.uid || req.user?.id || 'guest-user';
    const { title, description, sections, metadata } = req.body;

    try {
      if (admin.apps.length) {
        const db = admin.firestore();
        const courseRef = db.collection('users').doc(uid).collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();

        if (courseDoc.exists && courseDoc.data().ownerUid && courseDoc.data().ownerUid !== uid) {
          return res.status(403).json({ error: 'Not authorized.' });
        }

        await courseRef.set({
          ...(title && { title }),
          ...(description && { description }),
          ...(sections && { sections }),
          ...(metadata && { metadata }),
          status: 'draft',
          lastAutosaved: admin.firestore.FieldValue.serverTimestamp(),
          lastEditedBy: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    } catch (dbErr) {
      console.warn('Autosave Firestore sync skipped:', dbErr.message);
    }

    res.json({ success: true, savedAt: new Date().toISOString(), courseId });
  } catch (error) {
    console.error('Autosave error:', error);
    res.status(500).json({ error: 'Autosave failed.' });
  }
});

router.post('/courses', verifyFirebaseAuth, courseValidation, handleValidation, async (req, res) => {
  try {
    const uid = req.user?.uid || req.user?.id || 'guest-user';
    const { title, description, subject } = req.body;
    let courseId = `course-${Date.now()}`;

    try {
      if (admin.apps.length) {
        const db = admin.firestore();
        const courseRef = db.collection('users').doc(uid).collection('courses').doc();
        courseId = courseRef.id;
        await courseRef.set({
          title, description, subject,
          ownerUid: uid,
          status: 'draft',
          sections: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (dbErr) {
      console.warn('Course creation Firestore sync skipped:', dbErr.message);
    }

    res.status(201).json({ courseId, success: true });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

module.exports = router;
