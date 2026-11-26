import { Router, Request, Response } from 'express';
import { Database, hashPassword, verifyPassword } from '../db';
import { requireAuth, getEffectiveRole, AuthenticatedRequest, extractAuthToken } from '../middleware/authMiddleware';
import { ensureCsrfCookie, setAuthSessionCookies, clearAuthSessionCookies } from '../middleware/csrf';
import { OnboardingStatus } from '../../src/types/auth';
import { FirestoreSyncService } from '../services/firestoreSync';
import { adminAuth } from '../services/firebaseAdmin';
import { verifyFirebaseIdTokenSafely } from '../services/verifyFirebaseToken';
import { sendMail, isMailerConfigured, getMailerStatus, buildPasswordResetMessage } from '../services/mailer';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { getOrCreateSqlUser, isOwnerEmail } from '../../src/db/users.ts';
import { findAccountByEmailFromSql, persistAccountToSql } from '../../src/db/persistence';

const router = Router();

// GET /api/auth/csrf - ensure double-submit CSRF cookie is present for SPA forms/requests
router.get('/csrf', (req: Request, res: Response) => {
  const csrfToken = ensureCsrfCookie(req, res);
  res.json({ success: true, csrfToken });
});

// Limit password guessing per client IP. Multi-instance deployments should use
// a shared rate-limit store; test mode skips this to keep independent suites isolated.
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many sign-in attempts. Please try again later.' },
});

// POST /api/auth/signup
router.post('/signup', (req, res: Response) => {
  try {
    const { email, password, fullName, timezone, idToken } = req.body;

    if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 1024 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({ error: 'Password must be 8 to 1024 characters and include a letter and a number.' });
      return;
    }

    const { user, profile, token } = Database.createUser({
      email,
      password,
      fullName: fullName || email.split('@')[0],
      authProvider: 'email',
      avatarUrl: '/logo-mark.png',
      timezone: timezone || 'UTC',
    });

    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

    // Sync to Firestore, Cloud SQL PostgreSQL, & leaderboard
    void FirestoreSyncService.syncUserOnAuth(user, profile, gamification).catch((error) => console.warn('[FirestoreSync] Auth sync failed:', error));
    void getOrCreateSqlUser({
      uid: user.id,
      email: user.email,
      fullName: profile?.fullName,
      role: profile?.role,
      authProvider: user.authProvider,
    }).catch((error) => console.warn('[CloudSQL] User sync on signup failed:', error));

    setAuthSessionCookies(req, res, token);

    res.status(201).json({
      token,
      firebaseToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile?.role || 'student',
      },
      profile,
      gamification,
      settings,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create account.' });
  }
});

// POST /api/auth/signin
router.post('/signin', signinLimiter, async (req, res: Response) => {
  try {
    const { email, password, idToken } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 1024) {
      res.status(400).json({ error: 'A valid email and password are required.' });
      return;
    }

    if (!email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    let user = Database.findUserByEmail(email);
    if (!user) {
      const sqlUser = await findAccountByEmailFromSql(email);
      if (sqlUser) {
        await Database.hydrateFromSql();
        user = Database.findUserByEmail(email) || sqlUser;
      }
    }

    // Avoid exposing whether an email exists or which provider an account uses.
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password. Try again or use your sign-in provider.' });
      return;
    }

    const { valid, needsRehash } = verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password. Try again or use your sign-in provider.' });
      return;
    }

    // Transparently upgrade legacy hashes to salted scrypt
    if (needsRehash) {
      user.passwordHash = hashPassword(password);
    }

    // Update last login timestamp and ensure persistence
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    const token = Database.createSession(user.id);
    const storedProfile = Database.getProfile(user.id);
    const profile = storedProfile && isOwnerEmail(user.email) ? { ...storedProfile, role: 'student' as const } : storedProfile;
    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

    Database.saveToDisk();
    void persistAccountToSql(user);

    if (profile && gamification) {
      void FirestoreSyncService.syncUserOnAuth(user, profile, gamification).catch((error) => console.warn('[FirestoreSync] Auth sync failed:', error));
    }
    void getOrCreateSqlUser({
      uid: user.id,
      email: user.email,
      fullName: profile?.fullName,
      role: profile?.role,
      authProvider: user.authProvider,
    }).catch((error) => console.warn('[CloudSQL] User sync on signin failed:', error));

    setAuthSessionCookies(req, res, token);

    res.json({
      token,
      firebaseToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile?.role || 'student',
      },
      profile,
      gamification,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sign in failed.' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res: Response) => {
  try {
    const { email, name, avatarUrl, timezone, intent = 'auto', idToken } = req.body;

    if (!adminAuth) {
      res.status(503).json({ error: 'Google sign-in is unavailable until server-side Firebase authentication is configured.' });
      return;
    }
    if (typeof idToken !== 'string' || !idToken || idToken.includes('.mock_sig_')) {
      res.status(401).json({ error: 'A valid Google sign-in token is required.' });
      return;
    }
    const providedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (providedEmail && (providedEmail.length > 254 || !providedEmail.includes('@'))) {
      res.status(400).json({ error: 'A valid email is required for Google Sign-In.' });
      return;
    }
    let verifiedEmail: string;
    let decodedUid: string | undefined;
    let decodedName: string | undefined;
    let decodedPicture: string | undefined;
    try {
      const decoded = await verifyFirebaseIdTokenSafely(adminAuth, idToken, true);
      if (
        !decoded.email ||
        !decoded.email_verified ||
        decoded.firebase?.sign_in_provider !== 'google.com' ||
        (providedEmail && decoded.email.trim().toLowerCase() !== providedEmail)
      ) {
        res.status(401).json({ error: 'Google token does not match a verified Google account.' });
        return;
      }
      verifiedEmail = decoded.email.trim().toLowerCase();
      decodedUid = decoded.uid;
      decodedName = typeof decoded.name === 'string' ? decoded.name.trim() : undefined;
      decodedPicture = typeof decoded.picture === 'string' ? decoded.picture.trim() : undefined;
    } catch (err: any) {
      console.warn('[auth/google] Google ID token verification failure:', err?.code || err?.message || err);
      res.status(401).json({ error: 'Invalid or expired Google ID token.' });
      return;
    }

    let user = Database.findUserByEmail(verifiedEmail);
    if (!user) {
      const sqlUser = await findAccountByEmailFromSql(verifiedEmail);
      if (sqlUser) {
        await Database.hydrateFromSql();
        user = Database.findUserByEmail(verifiedEmail) || sqlUser;
      }
    }
    let token: string;
    let profile: any;

    if (!user) {
      if (intent === 'signin') {
        res.status(404).json({
          error: `No Learn.co account found for "${verifiedEmail}". Please create an account to get started.`,
          notFound: true,
          email: verifiedEmail,
        });
        return;
      }

      const created = Database.createUser({
        email: verifiedEmail,
        fullName: decodedName || name || verifiedEmail.split('@')[0],
        authProvider: 'google',
        avatarUrl: decodedPicture || avatarUrl || '/logo-mark.png',
        timezone: timezone || 'UTC',
      });
      user = created.user;
      if (decodedUid) {
        user.firebaseUid = decodedUid;
      }
      token = created.token;
      profile = created.profile;
      Database.saveToDisk();
    } else {
      if (decodedUid && !user.firebaseUid) {
        user.firebaseUid = decodedUid;
      }
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      token = Database.createSession(user.id);
      profile = Database.getProfile(user.id);
      const preferredAvatar = decodedPicture || avatarUrl;
      const preferredName = decodedName || name;
      if (profile) {
        const profileUpdates: Record<string, any> = {};
        if (preferredAvatar && (!profile.avatarUrl || profile.avatarUrl === '/logo-mark.png')) {
          profileUpdates.avatarUrl = preferredAvatar;
        }
        if (preferredName && (!profile.displayName || profile.displayName === verifiedEmail.split('@')[0])) {
          profileUpdates.displayName = preferredName;
          if (!profile.fullName || profile.fullName === verifiedEmail.split('@')[0]) {
            profileUpdates.fullName = preferredName;
          }
        }
        if (Object.keys(profileUpdates).length > 0) {
          profile = Database.updateProfile(user.id, profileUpdates);
        }
      }
      Database.saveToDisk();
      void persistAccountToSql(user);
    }

    if (isOwnerEmail(user.email)) {
      // Only the independently verified Google identity can create an owner
      // session. Previous password and legacy sessions remain non-admin.
      Database.revokeSession(token);
      token = Database.createSession(user.id, true);
      if (profile) profile = { ...profile, role: 'admin' };
    }

    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

    if (profile && gamification) {
      void FirestoreSyncService.syncUserOnAuth(user, profile, gamification).catch((error) => console.warn('[FirestoreSync] Auth sync failed:', error));
    }
    void getOrCreateSqlUser({
      uid: user.id,
      email: user.email,
      fullName: profile?.fullName,
      role: profile?.role,
      authProvider: user.authProvider,
    }).catch((error) => console.warn('[CloudSQL] User sync on google auth failed:', error));

    setAuthSessionCookies(req, res, token);

    res.json({
      token,
      googleToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile?.role || 'student',
      },
      profile,
      gamification,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google authentication failed.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = req.user!;
    const profile = Database.getProfile(userId);
    const gamification = Database.getGamification(userId);
    const settings = Database.getSettings(userId);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    const effectiveRole = getEffectiveRole(req);
    const effectiveProfile = { ...profile, role: effectiveRole };

    ensureCsrfCookie(req, res);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: effectiveRole,
      },
      profile: effectiveProfile,
      gamification,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch session.' });
  }
});

// POST /api/auth/signout
router.post('/signout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const token = extractAuthToken(req);
  if (token) {
    Database.revokeSession(token);
  }
  clearAuthSessionCookies(req, res);
  res.json({ success: true, message: 'Signed out successfully.' });
});

// POST /api/auth/onboarding
router.post('/onboarding', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      displayName,
      educationLevel,
      subjects,
      learningGoals,
      targetExam,
      targetScore,
      examDate,
      preferredStudyTimeMinutes,
      learningPreferences,
    } = req.body;

    const updatedProfile = Database.updateProfile(userId, {
      displayName,
      fullName: displayName || undefined,
      educationLevel,
      subjects,
      learningGoals,
      targetExam,
      targetScore,
      examDate,
      preferredStudyTimeMinutes,
      onboardingStatus: 'COMPLETED' as OnboardingStatus,
    });

    if (learningPreferences) {
      Database.updateSettings(userId, { learningPreferences });
    }

    res.json({
      success: true,
      profile: { ...updatedProfile, role: getEffectiveRole(req) },
      settings: Database.getSettings(userId),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save onboarding data.' });
  }
});

// ==========================================================
// PASSWORD RESET
// ==========================================================

// Throttle password reset requests by both client IP (blocks rotation attacks
// across many emails) and target email (max 5/hr/email to block distributed spam).
// Skipped in tests so the reset flow test suite is not throttled by its own assertions.
const resetIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req: any) => `reset:ip:${ipKeyGenerator(req.ip)}`,
  message: { error: 'Too many reset requests from this network. Please try again later.' },
});

const resetEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req: any) => process.env.NODE_ENV === 'test' || !String(req.body?.email || '').trim(),
  keyGenerator: (req: any) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `reset:email:${email}`;
  },
  message: { error: 'Too many reset requests for this address. Please try again later.' },
});

function isValidEmail(email: string): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * GET /api/auth/mail-status
 * Truthfully reports whether an outbound email relay (Resend or SMTP) is configured.
 */
router.get('/mail-status', (_req, res: Response) => {
  res.json({ success: true, ...getMailerStatus() });
});

/**
 * POST /api/auth/forgot-password
 *
 * Answers identically for known and unknown addresses. If email is unavailable
 * for the whole deployment, return a generic 503 before issuing any token.
 */
router.post('/forgot-password', resetIpLimiter, resetEmailLimiter, async (req, res: Response) => {
  const respond = () => res.json({
    success: true,
    message: 'If an account exists for that address, a reset link will be sent if delivery is available.',
    transport: 'email',
    expiresInMinutes: 30,
  });

  try {
    const email = String(req.body?.email || '').trim();
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!isMailerConfigured()) {
      // This is a deployment-wide condition, independent of account existence.
      // Do not generate a credential that cannot be delivered securely.
      res.status(503).json({
        error: 'Password reset email is unavailable because no email relay (RESEND_API_KEY, Gmail SMTP, or SMTP_URL) is configured on this server. Please ask the administrator or use Google Sign-In.',
      });
      return;
    }
    const ttlMinutes = 30;
    const issued = Database.createPasswordReset(email, ttlMinutes);

    // Unknown address, or an OAuth-only account with no password to reset.
    // Do nothing further, and answer exactly as we would for a real account.
    if (!issued) {
      respond();
      return;
    }

    // Do not trust Origin/Host request headers for password-reset links.
    let origin = 'https://learn-co.ai.studio';
    const configuredOrigin = process.env.APP_URL || process.env.APP_ORIGIN;
    if (configuredOrigin) {
      try {
        const parsed = new URL(configuredOrigin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') origin = parsed.origin;
      } catch {
        console.warn('[auth] Invalid APP_URL/APP_ORIGIN; using the default reset origin.');
      }
    }
    const resetUrl = `${origin}/?reset_token=${issued.token}`;

    const result = await sendMail(buildPasswordResetMessage(email, resetUrl, ttlMinutes));
    if (result.delivered === false) {
      // Log loudly for the operator, but still answer generically so a delivery
      // failure cannot be used as an account-existence signal.
      console.error('[auth] Password reset email could not be delivered:', result.reason);
    }
    respond();
  } catch {
    // Avoid logging provider errors that may contain recovery links or addresses.
    console.error('[auth] forgot-password failed.');
    res.status(500).json({ error: 'Could not process the reset request.' });
  }
});

/**
 * GET /api/auth/reset-password/:token
 * Lets the SPA confirm a link is valid before showing the "choose a password" form.
 */
router.get('/reset-password/:token', (req, res: Response) => {
  const result = Database.peekPasswordReset(req.params.token);
  if (!result) {
    res.status(400).json({ valid: false, error: 'This reset link is invalid or has expired.' });
    return;
  }
  res.json({ valid: true });
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
router.post('/reset-password', resetIpLimiter, (req, res: Response) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!token) {
      res.status(400).json({ error: 'Reset token is required.' });
      return;
    }
    // Mirrors the signup rule so a reset cannot be used to weaken the policy.
    if (password.length < 8 || password.length > 1024) {
      res.status(400).json({ error: 'Password must be at least 8 characters and at most 1024 characters.' });
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({ error: 'Password must include at least one letter and one number.' });
      return;
    }

    const result = Database.consumePasswordReset(token, password);
    if (!result) {
      res.status(400).json({ error: 'This reset link is invalid, expired, or already used.' });
      return;
    }

    // Existing sessions were revoked by consumePasswordReset; hand back a fresh one
    // so the user lands signed in rather than being bounced to the login screen.
    const session = Database.createSession(result.userId);
    const user = Database.findUserById(result.userId);
    setAuthSessionCookies(req, res, session);
    res.json({
      success: true,
      message: 'Your password has been updated.',
      token: session,
      user: user ? { id: user.id, email: user.email } : undefined,
    });
  } catch (err: any) {
    console.error('[auth] reset-password failed:', err?.message || err);
    res.status(500).json({ error: 'Could not reset the password.' });
  }
});

export default router;
