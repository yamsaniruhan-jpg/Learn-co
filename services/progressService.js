// services/progressService.js
const admin = require('../server/services/firebaseAdminCompat.cjs');


// Bridge to the application's authoritative local store. Firestore is optional
// here; when it is absent these endpoints must stay functional instead of
// silently discarding study progress and spaced-repetition reviews.
let appDatabase = null;
function getAppDatabase() {
  if (appDatabase) return appDatabase;
  try {
    // eslint-disable-next-line global-require
    appDatabase = require('../server/db').Database;
  } catch (err) {
    console.warn('Local progress store unavailable:', err.message);
    appDatabase = null;
  }
  return appDatabase;
}

let db = null;
function getDb() {
  if (!db) {
    try {
      let config = null;
      try {
        config = require('../firebase-applet-config.json');
      } catch {}

      if (config && config.firestoreDatabaseId && admin.apps.length) {
        try {
          const { getFirestore } = require('firebase-admin/firestore');
          db = getFirestore(admin.app(), config.firestoreDatabaseId);
        } catch {
          db = admin.firestore();
        }
      } else if (admin.apps.length) {
        db = admin.firestore();
      }
    } catch {
      db = null;
    }
  }
  return db;
}

/**
 * Update lesson progress
 */
async function updateProgress(uid, courseId, lessonId, data = {}) {
  const firestore = getDb();
  if (!firestore) return;

  const progressRef = firestore.collection('users').doc(uid).collection('progress').doc(courseId);

  await progressRef.set({
    courseId,
    lastStudied: admin.firestore.FieldValue.serverTimestamp(),
    timeSpentMinutes: admin.firestore.FieldValue.increment(data.minutesSpent || 0),
    [`lessons.${lessonId}`]: {
      completed: data.completed || false,
      score: data.score || null,
      timeSpent: data.minutesSpent || 0,
      lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
    },
  }, { merge: true });

  // Recalculate overall percentage
  await recalculateProgress(uid, courseId);

  // Update streak
  await updateStreak(uid);
}

/**
 * Recalculate course completion percentage
 */
async function recalculateProgress(uid, courseId) {
  const firestore = getDb();
  if (!firestore) return;

  const progressRef = firestore.collection('users').doc(uid).collection('progress').doc(courseId);
  const doc = await progressRef.get();
  if (!doc.exists) return;

  const data = doc.data() || {};
  const lessons = data.lessons || {};
  const totalLessons = Object.keys(lessons).length;
  const completedLessons = Object.values(lessons).filter(l => l && l.completed).length;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  await progressRef.update({
    totalLessons,
    completedLessons,
    percentage,
  });
}

/**
 * Daily streak tracker
 */
async function updateStreak(uid) {
  const firestore = getDb();
  if (!firestore) return;

  const profileRef = firestore.collection('users').doc(uid);
  const profile = await profileRef.get();
  const data = profile.exists ? profile.data() : {};

  const lastStudyDate = data.lastStudyDate?.toDate?.() || (data.lastStudyDate ? new Date(data.lastStudyDate) : null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = data.streak || 0;

  if (lastStudyDate) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastStudyDate.getTime() === today.getTime()) {
      // Already studied today, no change
      return;
    } else if (lastStudyDate.getTime() === yesterday.getTime()) {
      // Studied yesterday, increment streak
      streak += 1;
    } else {
      // Streak broken
      streak = 1;
    }
  } else {
    streak = 1;
  }

  await profileRef.set({
    streak,
    lastStudyDate: admin.firestore.Timestamp.fromDate(today),
    longestStreak: Math.max(streak, data.longestStreak || 0),
  }, { merge: true });
}

/**
 * Spaced repetition — get cards due for review
 */
async function getDueCards(uid, limit = 10) {
  const firestore = getDb();
  if (!firestore) {
    const localDb = getAppDatabase();
    if (!localDb) return [];
    // Unresolved mistakes are the authoritative local spaced-repetition queue.
    const mistakes = (localDb.getMistakes(uid) || []).filter((m) => !m.resolved);
    return mistakes.slice(0, limit).map((m) => ({
      id: m.id,
      questionText: m.questionText,
      subjectId: m.subjectId,
      topicId: m.topicId,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: m.lastAttemptedAt || new Date().toISOString(),
    }));
  }

  const now = admin.firestore.Timestamp.now();

  try {
    const snap = await firestore
      .collection('users').doc(uid)
      .collection('spacedRepetition')
      .where('nextReview', '<=', now)
      .orderBy('nextReview', 'asc')
      .limit(limit)
      .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Spaced repetition query warning (fallback without orderBy):', error.message);
    const snap = await firestore
      .collection('users').doc(uid)
      .collection('spacedRepetition')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

/**
 * Spaced repetition — update card after review (SM-2 algorithm)
 */
async function reviewCard(uid, cardId, quality) {
  const firestore = getDb();
  if (!firestore) return;

  // quality: 0-5 (0=complete failure, 5=perfect)
  const cardRef = firestore.collection('users').doc(uid).collection('spacedRepetition').doc(cardId);
  const cardDoc = await cardRef.get();
  if (!cardDoc.exists) return;

  const card = cardDoc.data() || {};
  let easeFactor = typeof card.easeFactor === 'number' ? card.easeFactor : 2.5;
  let interval = typeof card.interval === 'number' ? card.interval : 1;
  let repetitions = typeof card.repetitions === 'number' ? card.repetitions : 0;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await cardRef.update({
    easeFactor,
    interval,
    repetitions,
    nextReview: admin.firestore.Timestamp.fromDate(nextReview),
    lastReviewed: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Identify weak and strong topics from quiz performance
 */
async function analyzeWeaknesses(uid) {
  const firestore = getDb();
  if (!firestore) {
    const localDb = getAppDatabase();
    if (!localDb) return { weakTopics: [], strongTopics: [] };

    const aggregate = (records, key) => {
      const buckets = {};
      records.forEach((r) => {
        const topic = r[key] || r.topicId || 'general';
        if (!buckets[topic]) buckets[topic] = { topic, correct: 0, total: 0 };
        buckets[topic].total += 1;
        if (r.isCorrect) buckets[topic].correct += 1;
      });
      return Object.values(buckets).map((b) => ({
        topic: b.topic,
        accuracy: b.total ? Math.round((b.correct / b.total) * 100) : 0,
        attempts: b.total,
      }));
    };

    const attempts = localDb.getUserAttempts(uid) || [];
    const stats = aggregate(attempts, 'topicId');
    const weakTopics = stats.filter((t) => t.attempts >= 1 && t.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy);
    const strongTopics = stats.filter((t) => t.attempts >= 1 && t.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);
    return { weakTopics, strongTopics };
  }

  const progressSnap = await firestore
    .collection('users').doc(uid)
    .collection('progress')
    .get();

  const topicScores = {};

  progressSnap.docs.forEach(doc => {
    const data = doc.data() || {};
    const quizzes = data.quizScores || [];
    quizzes.forEach(q => {
      if (q && q.topic) {
        if (!topicScores[q.topic]) topicScores[q.topic] = [];
        topicScores[q.topic].push(q.score);
      }
    });
  });

  const weakTopics = [];
  const strongTopics = [];

  Object.entries(topicScores).forEach(([topic, scores]) => {
    if (!scores.length) return;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 60) weakTopics.push(topic);
    if (avg > 85) strongTopics.push(topic);
  });

  return { weakTopics, strongTopics };
}

module.exports = {
  updateProgress,
  recalculateProgress,
  updateStreak,
  getDueCards,
  reviewCard,
  analyzeWeaknesses,
};
