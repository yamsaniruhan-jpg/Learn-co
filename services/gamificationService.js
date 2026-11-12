// services/gamificationService.js
const admin = require('../server/services/firebaseAdminCompat.cjs');


// Bridge to the application's authoritative local store. Firestore is optional
// infrastructure here; when it is unavailable the JSON store must still receive
// every XP award so progress is never silently lost.
let appDatabase = null;
function getAppDatabase() {
  if (appDatabase) return appDatabase;
  try {
    // eslint-disable-next-line global-require
    appDatabase = require('../server/db').Database;
  } catch (err) {
    console.warn('Local gamification store unavailable:', err.message);
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

// XP awarded per action
const XP_RULES = {
  completeLesson: 50,
  passQuiz: 30,
  perfectQuiz: 75,
  createCourse: 200,
  publishCourse: 500,
  dailyLogin: 10,
  streakBonus7: 100,
  streakBonus30: 500,
  reviewFlashcard: 5,
  mentorSession: 150,
  leaveReview: 20,
  shareCourse: 15,
};

// Level curve — must match the canonical client/server implementation in
// src/types/auth.ts (calculateLevelFromXp): level = floor(sqrt(xp / 25)) + 1.
// Keeping both engines identical prevents the UI from showing two different
// levels for the same XP total.
function getLevel(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor(Math.sqrt(safeXp / 25)) + 1);
}

function getNextLevelXp(xp) {
  // Next level starts at level^2 * 25 for the curve defined by getLevel().
  const level = getLevel(xp);
  return level * level * 25;
}

function gamRef(uid) {
  const firestore = getDb();
  if (!firestore) return null;
  return firestore.collection('users').doc(uid).collection('gamification').doc('profile');
}

/**
 * Award XP to a user for an action
 * Returns the XP awarded, new level, and any badges earned
 */
async function awardXP(uid, action, metadata = {}) {
  const xpAmount = XP_RULES[action];
  if (!xpAmount) return { xpAwarded: 0, error: 'Unknown action' };

  const firestore = getDb();
  if (!firestore) {
    const localDb = getAppDatabase();
    const existing = localDb ? localDb.getGamification(uid) : null;
    const previousXp = existing ? existing.xp || 0 : 0;
    const previousLevel = existing ? existing.level || getLevel(previousXp) : 1;
    const newXP = previousXp + xpAmount;
    const newLevel = getLevel(newXP);

    if (localDb) {
      localDb.updateUserXp(uid, newXP, action);
    }

    return {
      xpAwarded: xpAmount,
      totalXP: newXP,
      level: newLevel,
      leveledUp: newLevel > previousLevel,
      newBadges: [],
      nextLevelXP: getNextLevelXp(newXP),
    };
  }

  const profileRef = gamRef(uid);
  const gamDoc = await profileRef.get();
  const gam = gamDoc.exists ? gamDoc.data() : { xp: 0, level: 1, badges: [], weeklyXP: 0, monthlyXP: 0 };

  const oldLevel = gam.level || 1;
  const newXP = (gam.xp || 0) + xpAmount;
  const newLevel = getLevel(newXP);
  const leveledUp = newLevel > oldLevel;

  // Update gamification profile
  await profileRef.set({
    xp: newXP,
    level: newLevel,
    weeklyXP: (gam.weeklyXP || 0) + xpAmount,
    monthlyXP: (gam.monthlyXP || 0) + xpAmount,
    lastAction: action,
    lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Check for new badges
  const newBadges = await checkBadges(uid, action, newXP, gam);

  // Log the XP event
  try {
    await firestore.collection('users').doc(uid).collection('xpLog').add({
      action,
      xp: xpAmount,
      totalXP: newXP,
      level: newLevel,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('xpLog write warning:', err.message);
  }

  return {
    xpAwarded: xpAmount,
    totalXP: newXP,
    level: newLevel,
    leveledUp,
    newBadges,
    nextLevelXP: getNextLevelXp(newXP),
  };
}

/**
 * Check and award badges based on user actions
 */
async function checkBadges(uid, action, totalXP, gamData = {}) {
  const firestore = getDb();
  if (!firestore) return [];

  const newBadges = [];
  const existingBadgeIds = (gamData.badges || []).map(b => b.badgeId);

  const badgeChecks = [
    {
      id: 'first_lesson',
      name: 'First Steps',
      icon: '👣',
      condition: action === 'completeLesson',
      check: async () => {
        try {
          const snap = await firestore.collection('users').doc(uid).collection('xpLog')
            .where('action', '==', 'completeLesson').limit(1).get();
          return snap.size === 1; // Just completed first
        } catch {
          return true;
        }
      },
    },
    {
      id: 'quiz_master',
      name: 'Quiz Master',
      icon: '🧠',
      condition: action === 'perfectQuiz',
      check: async () => {
        try {
          const snap = await firestore.collection('users').doc(uid).collection('xpLog')
            .where('action', '==', 'perfectQuiz').get();
          return snap.size >= 5;
        } catch {
          return false;
        }
      },
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      icon: '🔥',
      condition: action === 'dailyLogin',
      check: async () => {
        try {
          const profile = await firestore.collection('users').doc(uid).get();
          return (profile.data()?.streak || 0) >= 7;
        } catch {
          return false;
        }
      },
    },
    {
      id: 'streak_30',
      name: 'Monthly Machine',
      icon: '⚡',
      condition: action === 'dailyLogin',
      check: async () => {
        try {
          const profile = await firestore.collection('users').doc(uid).get();
          return (profile.data()?.streak || 0) >= 30;
        } catch {
          return false;
        }
      },
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      icon: '⭐',
      condition: true,
      check: async () => getLevel(totalXP) >= 5,
    },
    {
      id: 'level_10',
      name: 'Scholar',
      icon: '🎓',
      condition: true,
      check: async () => getLevel(totalXP) >= 10,
    },
    {
      id: 'first_course',
      name: 'Creator Debut',
      icon: '✏️',
      condition: action === 'publishCourse',
      check: async () => true,
    },
    {
      id: 'xp_1000',
      name: 'Knowledge Seeker',
      icon: '📚',
      condition: true,
      check: async () => totalXP >= 1000,
    },
    {
      id: 'xp_10000',
      name: 'Grand Master',
      icon: '👑',
      condition: true,
      check: async () => totalXP >= 10000,
    },
  ];

  for (const badge of badgeChecks) {
    if (existingBadgeIds.includes(badge.id)) continue;
    if (!badge.condition) continue;

    try {
      const earned = await badge.check();
      if (earned) {
        const badgeData = {
          badgeId: badge.id,
          badgeName: badge.name,
          icon: badge.icon,
          earnedAt: new Date().toISOString(),
        };

        const targetRef = gamRef(uid);
        if (targetRef) {
          await targetRef.set({
            badges: admin.firestore.FieldValue.arrayUnion(badgeData),
          }, { merge: true });
        }

        newBadges.push(badgeData);
      }
    } catch (error) {
      console.error(`Badge check error (${badge.id}):`, error);
    }
  }

  return newBadges;
}

/**
 * Get leaderboard (top users by XP)
 */
async function getLeaderboard(timeframe = 'all', limit = 20) {
  const firestore = getDb();
  if (!firestore) {
    const localDb = getAppDatabase();
    if (!localDb) return [];
    const users = localDb.getDb().users || {};
    const entries = Object.values(users).map((user) => {
      const gam = localDb.getGamification(user.id) || {};
      const profile = localDb.getProfile(user.id) || {};
      return {
        rank: 0,
        uid: user.id,
        name: profile.displayName || profile.fullName || (user.email ? user.email.split('@')[0] : 'Scholar'),
        picture: profile.avatarUrl || null,
        xp: gam.xp || 0,
        level: gam.level || getLevel(gam.xp || 0),
        streak: gam.currentStreak || 0,
      };
    });
    entries.sort((a, b) => b.xp - a.xp);
    return entries.slice(0, limit).map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  try {
    const snap = await firestore.collection('users').limit(limit).get();
    const leaderboard = [];
    let rank = 1;

    for (const doc of snap.docs) {
      const userData = doc.data() || {};
      const gam = userData.gamification || {};
      leaderboard.push({
        rank: rank++,
        uid: doc.id,
        name: userData.name || userData.displayName || 'Anonymous Scholar',
        picture: userData.picture || userData.avatarUrl || null,
        xp: gam.xp || userData.xp || 0,
        level: gam.level || getLevel(gam.xp || userData.xp || 0),
        streak: userData.streak || 0,
      });
    }

    leaderboard.sort((a, b) => b.xp - a.xp);
    leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return leaderboard;
  } catch (err) {
    console.warn('Leaderboard fetch warning:', err.message);
    return [];
  }
}

/**
 * Get user's full gamification profile
 */
async function getProfile(uid) {
  const firestore = getDb();
  if (!firestore) {
    const localDb = getAppDatabase();
    const gam = localDb ? localDb.getGamification(uid) : null;
    if (!gam) {
      return {
        xp: 0,
        level: 1,
        nextLevelXP: 100,
        streak: 1,
        longestStreak: 1,
        badges: [],
        weeklyXP: 0,
        monthlyXP: 0,
      };
    }
    return {
      xp: gam.xp || 0,
      level: gam.level || getLevel(gam.xp || 0),
      nextLevelXP: getNextLevelXp(gam.xp || 0),
      streak: gam.currentStreak || 0,
      longestStreak: gam.longestStreak || gam.currentStreak || 0,
      badges: gam.badges || [],
      weeklyXP: 0,
      monthlyXP: 0,
    };
  }

  const [gamDoc, userDoc] = await Promise.all([
    gamRef(uid).get().catch(() => null),
    firestore.collection('users').doc(uid).get().catch(() => null),
  ]);

  const gam = gamDoc && gamDoc.exists ? gamDoc.data() : { xp: 0, level: 1, badges: [] };
  const user = userDoc && userDoc.exists ? userDoc.data() : {};

  return {
    xp: gam.xp || 0,
    level: gam.level || getLevel(gam.xp || 0),
    nextLevelXP: getNextLevelXp(gam.xp || 0),
    streak: user.streak || 0,
    longestStreak: user.longestStreak || user.streak || 0,
    badges: gam.badges || [],
    weeklyXP: gam.weeklyXP || 0,
    monthlyXP: gam.monthlyXP || 0,
  };
}

module.exports = {
  awardXP,
  getLeaderboard,
  getProfile,
  checkBadges,
  XP_RULES,
  getLevel,
  getNextLevelXp,
};
