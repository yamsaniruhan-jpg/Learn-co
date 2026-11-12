// services/mentorshipService.js
const admin = require('../server/services/firebaseAdminCompat.cjs');


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
 * Demo fallback mentors if firestore has not yet been seeded
 */
const FALLBACK_MENTORS = [
  {
    id: 'mentor-elena-mit',
    name: 'Dr. Elena Rostova',
    title: 'Postdoc Fellow, MIT Quantum Institute',
    status: 'active',
    subjects: ['physics', 'math', 'stem'],
    levels: ['advanced', 'intermediate', 'olympiad'],
    specialties: ['Quantum Mechanics', 'Thermodynamics', 'Calculus', 'Competitive Exams'],
    rating: 4.95,
    totalSessions: 48,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mentor-marcus-ai',
    name: 'Marcus Vance',
    title: 'Staff ML Engineer, ex-DeepMind',
    status: 'active',
    subjects: ['computer-science', 'math', 'ai'],
    levels: ['beginner', 'intermediate', 'advanced'],
    specialties: ['Transformers', 'Neural Architectures', 'Linear Algebra', 'Algorithms'],
    rating: 4.9,
    totalSessions: 62,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mentor-priya-iit',
    name: 'Priya Sharma',
    title: 'JEE Advanced Rank 14, Math & Physics Olympiad Trainer',
    status: 'active',
    subjects: ['physics', 'math', 'chemistry'],
    levels: ['intermediate', 'advanced', 'olympiad'],
    specialties: ['Problem Solving', 'Calculus', 'Rotational Dynamics', 'Mock Tests'],
    rating: 4.98,
    totalSessions: 85,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
];

/**
 * AI-powered mentor matching
 */
async function findMentors(uid, preferences = {}) {
  const { subject, level, goals } = preferences;
  const firestore = getDb();
  let mentors = [];

  if (firestore) {
    try {
      let query = firestore.collection('mentors').where('status', '==', 'active');
      if (subject) {
        query = query.where('subjects', 'array-contains', subject);
      }
      const mentorsSnap = await query.limit(10).get();
      mentors = mentorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('Firestore mentor query fallback to catalog:', error.message);
    }
  }

  // If no mentors returned from Firestore, use curated catalog filtered by subject
  if (mentors.length === 0) {
    mentors = FALLBACK_MENTORS.filter(m => !subject || m.subjects.includes(subject) || m.subjects.includes('stem'));
    if (mentors.length === 0) mentors = FALLBACK_MENTORS;
  }

  // Score and rank mentors
  const scored = mentors.map(mentor => {
    let score = 0;
    if (mentor.levels?.includes(level)) score += 30;
    if (mentor.specialties?.some(s => goals?.includes(s))) score += 25;
    score += (mentor.rating || 4.5) * 10;
    score += Math.min(mentor.totalSessions || 0, 50); // Cap experience bonus
    return { ...mentor, matchScore: Math.min(Math.round(score), 100) };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Book a mentorship session
 */
async function bookSession(learnerUid, mentorId, sessionData = {}) {
  const firestore = getDb();
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = admin.firestore.FieldValue.serverTimestamp();

  if (firestore) {
    try {
      const sessionRef = firestore.collection('sessions').doc(sessionId);

      await sessionRef.set({
        learnerUid,
        mentorId,
        date: sessionData.date || new Date().toISOString(),
        duration: sessionData.duration || 30,
        topic: sessionData.topic || 'General STEM Consultation',
        goals: sessionData.goals || [],
        status: 'pending', // pending → confirmed → completed → cancelled
        createdAt: now,
      });

      // Notify mentor
      await firestore.collection('notifications').add({
        userId: mentorId,
        type: 'session_request',
        sessionId: sessionRef.id,
        message: `New session request from a learner about "${sessionData.topic || 'STEM Practice'}"`,
        read: false,
        createdAt: now,
      });

      return sessionRef.id;
    } catch (err) {
      console.warn('Firestore bookSession write warning:', err.message);
    }
  }

  return sessionId;
}

module.exports = { findMentors, bookSession };
