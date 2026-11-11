// services/marketplaceService.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch {}
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

const SEED_COURSES = [
  {
    id: 'course-calc-mastery',
    title: 'Advanced Multivariable Calculus & Vector Fields',
    description: 'First-principles intuition for Green, Stokes, and Divergence Theorems with interactive spatial visualizations.',
    subject: 'math',
    tags: ['Calculus', 'Vector Analysis', 'Differential Forms', 'Engineering Math'],
    creatorUid: 'creator-dr-elena',
    creatorName: 'Dr. Elena Rostova',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    totalLessons: 18,
    totalModules: 4,
    estimatedHours: 12,
    difficulty: 'advanced',
    rating: 4.9,
    ratingCount: 142,
    enrolledCount: 1280,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-quantum-mechanics',
    title: 'Quantum Mechanics: From State Vectors to Entanglement',
    description: 'Dirac notation, Hermitian operators, Harmonic Oscillator, and Bell inequality violations explained rigorously.',
    subject: 'physics',
    tags: ['Quantum', 'Linear Algebra', 'Schrodinger Equation', 'Atomic Physics'],
    creatorUid: 'creator-marcus',
    creatorName: 'Marcus Vance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    totalLessons: 24,
    totalModules: 5,
    estimatedHours: 16,
    difficulty: 'advanced',
    rating: 4.95,
    ratingCount: 98,
    enrolledCount: 950,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-organic-mechanisms',
    title: 'Organic Chemistry: Curved Arrow Reaction Mechanisms',
    description: 'Master nucleophilic attacks, carbocation rearrangements, and retrosynthetic analysis without rote memorization.',
    subject: 'chemistry',
    tags: ['Organic', 'Mechanisms', 'Stereochemistry', 'Synthesis'],
    creatorUid: 'creator-priya',
    creatorName: 'Priya Sharma',
    thumbnailUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80',
    totalLessons: 16,
    totalModules: 3,
    estimatedHours: 10,
    difficulty: 'intermediate',
    rating: 4.85,
    ratingCount: 76,
    enrolledCount: 710,
    price: 0,
    status: 'published',
  },
];

/**
 * Publish a course to the marketplace
 */
async function publishCourse(uid, courseId, courseData) {
  const firestore = getDb();
  if (!firestore) return courseId;

  // Copy from user's private courses to public marketplace
  const marketplaceRef = firestore.collection('marketplace').doc(courseId);

  await marketplaceRef.set({
    title: courseData.title,
    description: courseData.description,
    subject: courseData.subject,
    tags: courseData.tags || [],
    creatorUid: uid,
    creatorName: courseData.creatorName || 'Anonymous Scholar',
    thumbnailUrl: courseData.thumbnailUrl || null,
    totalLessons: courseData.totalLessons || 0,
    totalModules: courseData.totalModules || 0,
    estimatedHours: courseData.estimatedHours || 0,
    difficulty: courseData.difficulty || 'beginner',
    rating: courseData.rating || 0,
    ratingCount: courseData.ratingCount || 0,
    enrolledCount: courseData.enrolledCount || 0,
    price: courseData.price || 0,
    status: 'published',
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Mark original user draft/course as published
  try {
    await firestore.collection('users').doc(uid).collection('courses').doc(courseId).set({
      status: 'published',
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Original user course status update skipped:', err.message);
  }

  return courseId;
}

/**
 * Search marketplace with filters
 */
async function searchCourses({ query, subject, difficulty, sort, page, limit } = {}) {
  const firestore = getDb();
  let courses = [];

  if (firestore) {
    try {
      let q = firestore.collection('marketplace').where('status', '==', 'published');

      if (subject && subject !== 'all') {
        q = q.where('subject', '==', subject);
      }
      if (difficulty && difficulty !== 'all') {
        q = q.where('difficulty', '==', difficulty);
      }

      // Sorting
      switch (sort) {
        case 'popular':
          q = q.orderBy('enrolledCount', 'desc');
          break;
        case 'rating':
          q = q.orderBy('rating', 'desc');
          break;
        case 'newest':
          q = q.orderBy('publishedAt', 'desc');
          break;
        default:
          q = q.orderBy('publishedAt', 'desc');
      }

      const pageSize = limit || 12;
      q = q.limit(pageSize);

      const snap = await q.get();
      courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('Firestore marketplace search warning (fallback):', err.message);
      // Fallback query without compound indexes
      try {
        const snap = await firestore.collection('marketplace').limit(limit || 12).get();
        courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (innerErr) {
        courses = [];
      }
    }
  }

  if (courses.length === 0) {
    courses = [...SEED_COURSES];
    if (subject && subject !== 'all') {
      courses = courses.filter(c => c.subject === subject);
    }
    if (difficulty && difficulty !== 'all') {
      courses = courses.filter(c => c.difficulty === difficulty);
    }
  }

  // Client-side text search
  let filtered = courses;
  if (query && typeof query === 'string' && query.trim()) {
    const lowerQuery = query.toLowerCase().trim();
    filtered = courses.filter(c =>
      c.title?.toLowerCase().includes(lowerQuery) ||
      c.description?.toLowerCase().includes(lowerQuery) ||
      c.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  return filtered;
}

/**
 * Enroll in a course
 */
async function enrollCourse(uid, courseId) {
  const firestore = getDb();
  if (!firestore) return { success: true };

  // Check if already enrolled
  const enrollmentRef = firestore.collection('users').doc(uid).collection('enrollments').doc(courseId);
  const existing = await enrollmentRef.get().catch(() => null);
  if (existing && existing.exists) return { alreadyEnrolled: true };

  // Enroll
  await enrollmentRef.set({
    courseId,
    enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
    progress: 0,
  });

  // Increment marketplace counter
  try {
    await firestore.collection('marketplace').doc(courseId).update({
      enrolledCount: admin.firestore.FieldValue.increment(1),
    });
  } catch (err) {
    console.warn('Could not increment enrolledCount:', err.message);
  }

  return { success: true };
}

/**
 * Submit a review
 */
async function submitReview(uid, userName, courseId, rating, comment) {
  const firestore = getDb();
  if (!firestore) return;

  // Check if user already reviewed
  const existingSnap = await firestore.collection('marketplace')
    .doc(courseId).collection('reviews')
    .where('userId', '==', uid)
    .limit(1).get().catch(() => ({ empty: true }));

  if (!existingSnap.empty) {
    // Update existing review
    const reviewRef = existingSnap.docs[0].ref;
    await reviewRef.update({
      rating,
      comment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Create new review
    await firestore.collection('marketplace').doc(courseId).collection('reviews').add({
      userId: uid,
      userName: userName || 'Scholar',
      rating,
      comment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Recalculate average rating
  await recalculateRating(courseId);
}

async function recalculateRating(courseId) {
  const firestore = getDb();
  if (!firestore) return;

  try {
    const reviewsSnap = await firestore.collection('marketplace').doc(courseId).collection('reviews').get();
    const reviews = reviewsSnap.docs.map(d => d.data());

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length;

    await firestore.collection('marketplace').doc(courseId).update({
      rating: Math.round(avgRating * 10) / 10,
      ratingCount: reviews.length,
    });
  } catch (err) {
    console.warn('Recalculate rating warning:', err.message);
  }
}

module.exports = {
  publishCourse,
  searchCourses,
  enrollCourse,
  submitReview,
  recalculateRating,
  SEED_COURSES,
};
