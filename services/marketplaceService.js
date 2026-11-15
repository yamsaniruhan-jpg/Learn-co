// services/marketplaceService.js
const admin = require('../server/services/firebaseAdminCompat.cjs');

let db = null;
function getDb() {
  if (!db) {
    try {
      // The compatibility layer selects FIRESTORE_DATABASE_ID (if set) and
      // handles missing credentials. Never silently fall back to another DB.
      db = admin.firestore();
    } catch {
      db = null;
    }
  }
  return db;
}

// Local runtime fallback stores so Marketplace enrollment, counters, and reviews
// stay responsive even when Firestore Admin is running without cross-project IAM.
const localEnrollments = new Map(); // uid -> Set<courseId>
const localCourseCounters = new Map(); // courseId -> { enrolledDelta, rating, ratingCount }
const localReviews = new Map(); // courseId -> Array<{ id, userId, userName, rating, comment, createdAt }>

const SEED_COURSES = [
  {
    id: 'course-calc-mastery',
    title: 'Advanced Multivariable Calculus & Vector Fields',
    description: 'First-principles intuition for Green, Stokes, and Divergence Theorems with interactive spatial visualizations.',
    subject: 'math',
    tags: ['Calculus', 'Vector Analysis', 'Differential Forms', 'Engineering Math'],
    modules: ['Partial Derivatives & Gradients', 'Multiple Integrals & Jacobians', 'Line & Surface Integrals', 'Stokes & Divergence Theorems'],
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
    modules: ['Hilbert Spaces & Dirac Bra-Ket Notation', 'Time Evolution & Schrodinger Equation', 'Quantum Harmonic Oscillator', 'Spin, Angular Momentum & Entanglement'],
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
    modules: ['Electron Pushing & Acid-Base Equilibria', 'SN1, SN2, E1 & E2 Competition', 'Carbonyl Chemistry & Enolates', 'Multi-Step Retrosynthesis'],
    creatorUid: 'creator-priya',
    creatorName: 'Priya Sharma',
    thumbnailUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80',
    totalLessons: 16,
    totalModules: 4,
    estimatedHours: 10,
    difficulty: 'intermediate',
    rating: 4.85,
    ratingCount: 76,
    enrolledCount: 710,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-algorithms-dp',
    title: 'Algorithms, Graph Theory & Dynamic Programming',
    description: 'Build systematic mastery over recurrence relations, shortest paths, network flow, and NP-completeness proofs.',
    subject: 'cs',
    tags: ['Algorithms', 'Dynamic Programming', 'Graphs', 'Complexity'],
    modules: ['Asymptotics & Divide-and-Conquer', 'Greedy Invariants & Shortest Paths', 'Dynamic Programming State Compression', 'Max-Flow Min-Cut & Reductions'],
    creatorUid: 'creator-kenji',
    creatorName: 'Prof. Kenji Takahashi',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    totalLessons: 20,
    totalModules: 4,
    estimatedHours: 14,
    difficulty: 'intermediate',
    rating: 4.9,
    ratingCount: 184,
    enrolledCount: 1640,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-molecular-biology',
    title: 'Molecular Biology & Cellular Gene Regulation',
    description: 'Explore CRISPR mechanisms, chromatin epigenetics, metabolic pathways, and signal transduction cascades.',
    subject: 'biology',
    tags: ['Genetics', 'CRISPR', 'Biochemistry', 'Cell Biology'],
    modules: ['DNA Replication & Repair Fidelity', 'Transcription & Epigenetic Control', 'Metabolic Flux & ATP Synthesis', 'CRISPR-Cas9 Engineering'],
    creatorUid: 'creator-amara',
    creatorName: 'Dr. Amara Okafor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop&q=80',
    totalLessons: 14,
    totalModules: 4,
    estimatedHours: 9,
    difficulty: 'beginner',
    rating: 4.8,
    ratingCount: 64,
    enrolledCount: 590,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-linear-algebra-ml',
    title: 'Linear Algebra for Machine Learning & Optimization',
    description: 'Eigenvalues, SVD, matrix calculus, and convex gradient descent explained visually for modern AI engineers.',
    subject: 'math',
    tags: ['Linear Algebra', 'SVD', 'Optimization', 'Machine Learning'],
    modules: ['Vector Spaces & Orthogonal Projections', 'Eigenvalues & Spectral Theorem', 'Singular Value Decomposition', 'Convex Optimization & Hessians'],
    creatorUid: 'creator-dr-elena',
    creatorName: 'Dr. Elena Rostova',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    totalLessons: 15,
    totalModules: 4,
    estimatedHours: 11,
    difficulty: 'beginner',
    rating: 4.92,
    ratingCount: 215,
    enrolledCount: 1890,
    price: 0,
    status: 'published',
  },
];

function applyLocalStats(course) {
  const stats = localCourseCounters.get(course.id);
  if (!stats) return course;
  return {
    ...course,
    enrolledCount: (course.enrolledCount || 0) + (stats.enrolledDelta || 0),
    rating: stats.rating ?? course.rating,
    ratingCount: stats.ratingCount ?? course.ratingCount,
  };
}

/**
 * Publish a course to the marketplace
 */
async function publishCourse(uid, courseId, courseData) {
  const firestore = getDb();
  if (!firestore) {
    const error = new Error('Course publishing is unavailable. Please try again later.');
    error.statusCode = 503;
    throw error;
  }

  const marketplaceRef = firestore.collection('marketplace').doc(courseId);
  const userCourseRef = firestore.collection('users').doc(uid).collection('courses').doc(courseId);
  await firestore.runTransaction(async (transaction) => {
    const existing = await transaction.get(marketplaceRef);
    if (existing.exists && existing.data().creatorUid !== uid) {
      const error = new Error('You cannot publish another creator’s course.');
      error.statusCode = 403;
      throw error;
    }
    const details = {
      title: courseData.title.trim(),
      description: courseData.description.trim(),
      subject: courseData.subject.trim().toLowerCase(),
      tags: courseData.tags || [],
      creatorUid: uid,
      creatorName: courseData.creatorName || 'Anonymous Scholar',
      thumbnailUrl: courseData.thumbnailUrl || null,
      totalLessons: courseData.totalLessons || 0,
      totalModules: courseData.totalModules || 0,
      estimatedHours: courseData.estimatedHours || 0,
      difficulty: courseData.difficulty || 'beginner',
      price: courseData.price || 0,
      status: 'published',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (!existing.exists) {
      details.rating = 0;
      details.ratingCount = 0;
      details.enrolledCount = 0;
      details.publishedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    transaction.set(marketplaceRef, details, { merge: true });
    transaction.set(userCourseRef, {
      status: 'published', publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  return courseId;
}

/**
 * Search marketplace with filters
 */
async function searchCourses({ query, subject, difficulty, sort, limit } = {}) {
  const firestore = getDb();
  let courses = [];
  let fetchedFromFirestore = false;
  const requestedLimit = Number(limit);
  const pageSize = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 12;

  if (firestore) {
    try {
      let q = firestore.collection('marketplace').where('status', '==', 'published');

      if (subject && subject !== 'all') {
        q = q.where('subject', '==', subject.toLowerCase());
      }
      if (difficulty && difficulty !== 'all') {
        q = q.where('difficulty', '==', difficulty.toLowerCase());
      }

      switch (sort) {
        case 'popular':
          q = q.orderBy('enrolledCount', 'desc');
          break;
        case 'rating':
          q = q.orderBy('rating', 'desc');
          break;
        case 'newest':
        default:
          q = q.orderBy('publishedAt', 'desc');
      }

      q = q.limit(pageSize);

      const snap = await q.get();
      courses = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(c => c.status === 'published');
      fetchedFromFirestore = true;
    } catch (err) {
      try {
        const snap = await firestore.collection('marketplace').where('status', '==', 'published').limit(pageSize).get();
        courses = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(c => c.status === 'published');
        fetchedFromFirestore = true;
      } catch {
        courses = [];
      }
    }
  }

  if (!fetchedFromFirestore) {
    courses = SEED_COURSES.map(applyLocalStats);
  }

  if (subject && subject !== 'all') {
    const targetSubj = subject.trim().toLowerCase();
    courses = courses.filter((c) => {
      const s = (c.subject || '').toLowerCase();
      if (targetSubj === 'programming') return s === 'cs' || s === 'programming';
      if (targetSubj === 'science') return s === 'physics' || s === 'chemistry' || s === 'biology' || s === 'science';
      return s === targetSubj;
    });
  }

  if (difficulty && difficulty !== 'all') {
    const targetDiff = difficulty.trim().toLowerCase();
    courses = courses.filter((c) => (c.difficulty || '').toLowerCase() === targetDiff);
  }

  let filtered = courses;
  if (query && typeof query === 'string' && query.trim()) {
    const lowerQuery = query.toLowerCase().trim();
    filtered = courses.filter(c =>
      c.title?.toLowerCase().includes(lowerQuery) ||
      c.description?.toLowerCase().includes(lowerQuery) ||
      c.creatorName?.toLowerCase().includes(lowerQuery) ||
      c.subject?.toLowerCase().includes(lowerQuery) ||
      c.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  if (sort === 'popular') {
    filtered = [...filtered].sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
  } else if (sort === 'rating') {
    filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return { courses: filtered.slice(0, pageSize), catalogSource: fetchedFromFirestore ? 'firebase' : 'sample' };
}

/**
 * Get user enrolled course IDs
 */
async function getUserEnrollments(uid) {
  const enrolled = new Set(localEnrollments.get(uid) || []);
  const firestore = getDb();
  if (firestore) {
    try {
      const snap = await firestore.collection('users').doc(uid).collection('enrollments').get();
      snap.docs.forEach((d) => enrolled.add(d.id));
    } catch {
      // Fallback to local enrollment store
    }
  }
  return Array.from(enrolled);
}

/**
 * Enroll in a course
 */
async function enrollCourse(uid, courseId) {
  const firestore = getDb();
  let course = SEED_COURSES.find(c => c.id === courseId);
  if (firestore) {
    try {
      const snapshot = await firestore.collection('marketplace').doc(courseId).get();
      if (snapshot.exists) course = snapshot.data();
    } catch {
      const error = new Error('Course availability could not be verified. Please try again.');
      error.statusCode = 503;
      throw error;
    }
  }
  if (!course || course.status !== 'published') {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }
  // Payment processing is not wired to marketplace enrollment yet.
  if (typeof course.price !== 'number' || !Number.isFinite(course.price) || course.price < 0) {
    const error = new Error('Course price could not be verified.');
    error.statusCode = 503;
    throw error;
  }
  if (course.price > 0) {
    const error = new Error('Paid course enrollment is not available yet.');
    error.statusCode = 402;
    throw error;
  }
  if (!localEnrollments.has(uid)) {
    localEnrollments.set(uid, new Set());
  }
  const userSet = localEnrollments.get(uid);
  if (userSet.has(courseId) && !firestore) {
    return { alreadyEnrolled: true, persistence: 'memory' };
  }

  if (firestore) {
    try {
      const enrollmentRef = firestore.collection('users').doc(uid).collection('enrollments').doc(courseId);
      const existing = await enrollmentRef.get();
      if (existing && existing.exists) {
        userSet.add(courseId);
        return { alreadyEnrolled: true, persistence: 'firebase' };
      }

      await enrollmentRef.set({
        courseId,
        enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
        progress: 0,
      });

      await firestore.collection('marketplace').doc(courseId).update({
        enrolledCount: admin.firestore.FieldValue.increment(1),
      }).catch(() => {});
    } catch {
      const error = new Error('Enrollment could not be saved. Please try again.');
      error.statusCode = 503;
      throw error;
    }
  }

  userSet.add(courseId);
  const prev = localCourseCounters.get(courseId) || { enrolledDelta: 0 };
  localCourseCounters.set(courseId, { ...prev, enrolledDelta: (prev.enrolledDelta || 0) + 1 });

  return { success: true, persistence: firestore ? 'firebase' : 'memory' };
}

/**
 * Get reviews for a course
 */
async function getCourseReviews(courseId) {
  const firestore = getDb();
  if (firestore) {
    try {
      const snap = await firestore
        .collection('marketplace').doc(courseId)
        .collection('reviews')
        .orderBy('createdAt', 'desc')
        .limit(20).get();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (rows.length > 0) return rows;
    } catch {
      // Fall through to local reviews
    }
  }
  return localReviews.get(courseId) || [];
}

/**
 * Submit a review
 */
async function submitReview(uid, userName, courseId, rating, comment) {
  const firestore = getDb();
  const cleanReview = {
    id: `rev-${uid}-${Date.now().toString(36)}`,
    userId: uid,
    userName: userName || 'Scholar',
    rating: Number(rating),
    comment: String(comment || '').trim(),
    createdAt: new Date().toISOString(),
  };

  if (firestore) {
    try {
      const existingSnap = await firestore.collection('marketplace')
        .doc(courseId).collection('reviews')
        .where('userId', '==', uid)
        .limit(1).get();

      if (!existingSnap.empty) {
        await existingSnap.docs[0].ref.update({
          rating: cleanReview.rating,
          comment: cleanReview.comment,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await firestore.collection('marketplace').doc(courseId).collection('reviews').add({
          userId: uid,
          userName: cleanReview.userName,
          rating: cleanReview.rating,
          comment: cleanReview.comment,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await recalculateRating(courseId);
    } catch {
      const error = new Error('Review could not be saved. Please try again.');
      error.statusCode = 503;
      throw error;
    }
  }

  const list = localReviews.get(courseId) || [];
  const existingIndex = list.findIndex((r) => r.userId === uid);
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...cleanReview };
  } else {
    list.unshift(cleanReview);
  }
  localReviews.set(courseId, list);

  // Update local rating summary
  const baseCourse = SEED_COURSES.find((c) => c.id === courseId);
  const baseCount = baseCourse ? baseCourse.ratingCount : 0;
  const baseTotal = baseCourse ? baseCourse.rating * baseCount : 0;
  const sumLocal = list.reduce((acc, r) => acc + r.rating, 0);
  const totalCount = baseCount + list.length;
  const avg = totalCount > 0 ? Math.round(((baseTotal + sumLocal) / totalCount) * 10) / 10 : cleanReview.rating;
  const prev = localCourseCounters.get(courseId) || { enrolledDelta: 0 };
  localCourseCounters.set(courseId, { ...prev, rating: avg, ratingCount: totalCount });

  return { ...cleanReview, persistence: firestore ? 'firebase' : 'memory' };
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
  getUserEnrollments,
  enrollCourse,
  getCourseReviews,
  submitReview,
  recalculateRating,
  SEED_COURSES,
};
