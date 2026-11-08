// middleware/aiRateLimit.js
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

let db;
try {
  db = admin.firestore();
} catch {
  db = null;
}

// Tier limits (requests per hour and day)
const TIER_LIMITS = {
  free:  { hourly: 10,  daily: 50 },
  pro:   { hourly: 100, daily: 1000 },
  super: { hourly: 500, daily: 5000 },
};

// Fast in-memory limiter for brute-force protection
const bruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many requests. Please slow down.', code: 'BRUTE_FORCE' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.user?.uid || req.ip,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
});

// Firestore-backed tier-aware limiter with fail-open resilience
async function aiTierLimiter(req, res, next) {
  try {
    const uid = req.user?.id || req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Authentication required for AI features.' });
    }

    const tier = req.user?.subscription || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    if (!db) {
      try {
        db = admin.firestore();
      } catch {
        return next();
      }
    }

    let usage = { hourlyCount: 0, dailyCount: 0 };
    const now = admin.firestore.Timestamp.now();
    const usageRef = db.collection('users').doc(uid).collection('usage').doc('ai');

    try {
      const usageDoc = await usageRef.get();
      if (usageDoc.exists) {
        usage = usageDoc.data();
      }
    } catch (firestoreErr) {
      // Fail open on permission denied or offline Firestore
      console.warn('Firestore rate limit read skipped (permission/network):', firestoreErr.message);
      return next();
    }

    let hourlyCount = usage.hourlyCount || 0;
    let dailyCount = usage.dailyCount || 0;

    if (usage.lastHourReset && usage.lastHourReset.toDate() < new Date(Date.now() - 3600000)) {
      hourlyCount = 0;
    }
    if (usage.lastDayReset && usage.lastDayReset.toDate() < new Date(Date.now() - 86400000)) {
      dailyCount = 0;
    }

    if (hourlyCount >= limits.hourly) {
      return res.status(429).json({
        error: `Hourly AI limit reached (${limits.hourly}/${tier}).`,
        code: 'RATE_LIMIT_HOURLY',
        upgrade: tier === 'free' ? '/pricing' : null,
        retryAfter: 3600,
      });
    }
    if (dailyCount >= limits.daily) {
      return res.status(429).json({
        error: `Daily AI limit reached (${limits.daily}/${tier}).`,
        code: 'RATE_LIMIT_DAILY',
        upgrade: tier === 'free' ? '/pricing' : null,
        retryAfter: 86400,
      });
    }

    try {
      await usageRef.set({
        hourlyCount: hourlyCount + 1,
        dailyCount: dailyCount + 1,
        lastHourReset: hourlyCount === 0 ? now : (usage.lastHourReset || now),
        lastDayReset: dailyCount === 0 ? now : (usage.lastDayReset || now),
        lastRequest: now,
      }, { merge: true });
    } catch (writeErr) {
      console.warn('Firestore rate limit write skipped (permission/network):', writeErr.message);
    }

    res.set('X-AI-Remaining-Hourly', String(limits.hourly - hourlyCount - 1));
    res.set('X-AI-Remaining-Daily', String(limits.daily - dailyCount - 1));

    next();
  } catch (err) {
    console.error('Rate limiter error:', err);
    next();
  }
}

// Compatibility export
function aiRateLimiter(req, res, next) {
  return aiTierLimiter(req, res, next);
}
aiRateLimiter.aiTierLimiter = aiTierLimiter;
aiRateLimiter.bruteForceLimiter = bruteForceLimiter;
aiRateLimiter.TIER_LIMITS = TIER_LIMITS;

module.exports = { bruteForceLimiter, aiTierLimiter, aiRateLimiter, TIER_LIMITS };
