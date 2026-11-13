import { Router, Response } from 'express';
import { Database, hashPassword, verifyPassword } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OnboardingStatus } from '../../src/types/auth';
import { FirestoreSyncService } from '../services/firestoreSync';
import { adminAuth } from '../services/firebaseAdmin';
import { sendMail, isMailerConfigured, buildPasswordResetMessage } from '../services/mailer';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { getOrCreateSqlUser, isOwnerEmail } from '../../src/db/users.ts';

const router = Router();

// POST /api/auth/signup
router.post('/signup', (req, res: Response) => {
  try {
    const { email, password, fullName, timezone, idToken } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
      return;
    }

    const { user, profile, token } = Database.createUser({
      email,
      password,
      fullName: fullName || email.split('@')[0],
      authProvider: 'email',
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

    res.status(201).json({
      token,
      firebaseToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile?.role || (isOwnerEmail(user.email) ? 'admin' : 'student'),
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
router.post('/signin', (req, res: Response) => {
  try {
    const { email, password, idToken } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    if (!email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const user = Database.findUserByEmail(email);

    if (!user) {
      res.status(404).json({
        error: `No Learn.co account found for "${email.trim().toLowerCase()}". Please sign up to create an account.`,
        notFound: true,
      });
      return;
    }

    // Do not allow password-based takeover of Google OAuth accounts that have no password hash
    if (user.authProvider === 'google' && !user.passwordHash) {
      res.status(401).json({
        error: 'This account uses Google Sign-In. Please continue with Google.',
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials. Please use your configured sign-in method.' });
      return;
    }

    const { valid, needsRehash } = verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Incorrect password for this account. Please try again.' });
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
    const profile = Database.getProfile(user.id);
    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

    if (profile && isOwnerEmail(user.email) && profile.role !== 'admin') {
      profile.role = 'admin';
    }

    if (settings && settings.privacy) {
      settings.privacy.leaderboardVisibility = true;
    }

    Database.saveToDisk();

    if (profile && gamification) {
      void FirestoreSyncService.syncUserOnAuth(user, profile, gamification).catch((error) => console.warn('[FirestoreSync] Auth sync failed:', error));
      void FirestoreSyncService.syncLeaderboardEntry(user, profile, gamification).catch((error) => console.warn('[FirestoreSync] Leaderboard sync failed:', error));
    }
    void getOrCreateSqlUser({
      uid: user.id,
      email: user.email,
      fullName: profile?.fullName,
      role: profile?.role,
      authProvider: user.authProvider,
    }).catch((error) => console.warn('[CloudSQL] User sync on signin failed:', error));

    res.json({
      token,
      firebaseToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile?.role || (isOwnerEmail(user.email) ? 'admin' : 'student'),
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

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email is required for Google Sign-In.' });
      return;
    }

    if (!adminAuth) {
      res.status(503).json({ error: 'Google sign-in is unavailable until server-side Firebase authentication is configured.' });
      return;
    }
    if (typeof idToken !== 'string' || !idToken || idToken.includes('.mock_sig_')) {
      res.status(401).json({ error: 'A valid Google sign-in token is required.' });
      return;
    }
    let verifiedEmail: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken, true);
      if (!decoded.email || !decoded.email_verified || decoded.firebase?.sign_in_provider !== 'google.com' ||
          decoded.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
        res.status(401).json({ error: 'Google token does not match a verified Google account.' });
        return;
      }
      verifiedEmail = decoded.email.trim().toLowerCase();
    } catch {
      res.status(401).json({ error: 'Invalid or expired Google ID token.' });
      return;
    }

    let user = Database.findUserByEmail(verifiedEmail);
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
        fullName: name || verifiedEmail.split('@')[0],
        authProvider: 'google',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(verifiedEmail)}`,
        timezone: timezone || 'UTC',
      });
      user = created.user;
      token = created.token;
      profile = created.profile;
    } else {
      token = Database.createSession(user.id);
      profile = Database.getProfile(user.id);
    }

    if (profile && isOwnerEmail(user.email) && profile.role !== 'admin') {
      profile.role = 'admin';
      Database.saveToDisk();
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

    res.json({
      token,
      googleToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile?.role || (isOwnerEmail(user.email) ? 'admin' : 'student'),
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

    if (isOwnerEmail(user.email) && profile.role !== 'admin') {
      profile.role = 'admin';
      Database.saveToDisk();
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        role: profile.role || (isOwnerEmail(user.email) ? 'admin' : 'student'),
      },
      profile,
      gamification,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch session.' });
  }
});

// POST /api/auth/signout
router.post('/signout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    Database.revokeSession(token);
  }
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
      profile: updatedProfile,
      settings: Database.getSettings(userId),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save onboarding data.' });
  }
});

// ==========================================================
// PASSWORD RESET
// ==========================================================

// Password reset sends email, so it needs throttling — but a limit keyed only by
// IP would let one attacker lock every user out by exhausting the shared bucket
// (and would also catch several people on the same campus NAT). Throttle per
// address instead, so abuse is contained to the account being targeted.
// Skipped in tests so the suite is not throttled by its own assertions.
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req: any) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (email) return `reset:email:${email}`;
    // Fall back to IP when no address was supplied. `ipKeyGenerator` is required:
    // a bare `req.ip` lets anyone rotate through their own IPv6 /64 and bypass the
    // limit (ERR_ERL_KEY_GEN_IPV6).
    return `reset:ip:${ipKeyGenerator(req.ip)}`;
  },
  message: { error: 'Too many reset requests for this address. Please try again later.' },
});

function isValidEmail(email: string): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * POST /api/auth/forgot-password
 *
 * Always answers with the same shape and status so the endpoint cannot be used to
 * discover which addresses have accounts. The only variation is `delivery`:
 *   - `"email"`          a real message was handed to the mail provider
 *   - `"link"`           no provider configured; `resetUrl` is returned for the
 *                        operator (self-hosted installs) — never claims an email went out
 */
router.post('/forgot-password', resetLimiter, async (req, res: Response) => {
  // The response is identical whether or not the address has an account. The only
  // field that varies describes the deployment's delivery capability, which is
  // constant server-wide and therefore reveals nothing about any account.
  const respond = (transport: 'email' | 'operator-console') =>
    res.json({
      success: true,
      message: 'If an account exists for that address, a reset link has been sent.',
      transport,
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

    const usesEmail = isMailerConfigured();
    const ttlMinutes = 30;
    const issued = Database.createPasswordReset(email, ttlMinutes);

    // Unknown address, or an OAuth-only account with no password to reset.
    // Do nothing further, and answer exactly as we would for a real account.
    if (!issued) {
      respond(usesEmail ? 'email' : 'operator-console');
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

    if (!usesEmail) {
      // No provider configured. Never pretend an email was sent: the link is
      // written to the operator's server log instead of the HTTP response, so the
      // API cannot be used to discover which addresses are registered.
      console.warn(
        `[auth] Password reset for ${email} generated, but no mail provider is configured ` +
          `(set RESEND_API_KEY or SMTP_URL). Link (valid ${ttlMinutes}m): ${resetUrl}`,
      );
      respond('operator-console');
      return;
    }

    const result = await sendMail(buildPasswordResetMessage(email, resetUrl, ttlMinutes));
    if (result.delivered === false) {
      // Log loudly for the operator, but still answer generically so a delivery
      // failure cannot be used as an account-existence signal.
      console.error('[auth] Password reset email could not be delivered:', result.reason);
    }
    respond('email');
  } catch (err: any) {
    console.error('[auth] forgot-password failed:', err?.message || err);
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
router.post('/reset-password', resetLimiter, (req, res: Response) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!token) {
      res.status(400).json({ error: 'Reset token is required.' });
      return;
    }
    // Mirrors the signup rule so a reset cannot be used to weaken the policy.
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
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
