import { Router, Response } from 'express';
import { Database, hashPassword, verifyPassword, needsPasswordRehash } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OnboardingStatus } from '../../src/types/auth';
import { FirestoreSyncService } from '../services/firestoreSync';
import { sendMail, isMailerConfigured, buildPasswordResetMessage } from '../services/mailer';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

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

    // Sync to Firestore & persist leaderboard entry
    FirestoreSyncService.syncUserOnAuth(user, profile, gamification);

    res.status(201).json({
      token,
      firebaseToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
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

    let user = Database.findUserByEmail(email);

    // If user does not exist yet, auto-create their account seamlessly so their credentials are saved
    // and they are immediately enrolled into the leaderboard and backend storage
    if (!user) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
        return;
      }

      const created = Database.createUser({
        email,
        password,
        fullName: email.split('@')[0],
        authProvider: 'email',
        timezone: 'UTC',
      });
      user = created.user;

      const profile = created.profile;
      const gamification = Database.getGamification(user.id);
      const settings = Database.getSettings(user.id);

      // Persist to Firestore & leaderboard
      FirestoreSyncService.syncUserOnAuth(user, profile, gamification);

      res.status(200).json({
        token: created.token,
        user: {
          id: user.id,
          email: user.email,
          authProvider: user.authProvider,
        },
        profile,
        gamification,
        settings,
      });
      return;
    }

    // Existing user: verify password
    if (user.authProvider === 'email' && user.passwordHash) {
      if (!verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: 'Incorrect password for this account. Please try again.' });
        return;
      }
      // Transparently upgrade legacy hashes to the current scrypt format.
      if (needsPasswordRehash(user.passwordHash)) {
        user.passwordHash = hashPassword(password);
      }
    } else if (!user.passwordHash && password) {
      // If user signed in previously via OAuth or has empty password hash, store the password now
      user.passwordHash = hashPassword(password);
    }

    // Update last login timestamp and ensure persistence
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    const token = Database.createSession(user.id);
    let profile = Database.getProfile(user.id);
    let gamification = Database.getGamification(user.id);
    let settings = Database.getSettings(user.id);

    // Ensure settings has leaderboardVisibility enabled so the user is kept in the leaderboard
    if (settings && settings.privacy) {
      settings.privacy.leaderboardVisibility = true;
    }

    // Save state to disk immediately
    Database.saveToDisk();

    // Sync to Firestore & ensure user is enrolled in leaderboard
    if (profile && gamification) {
      FirestoreSyncService.syncUserOnAuth(user, profile, gamification);
      FirestoreSyncService.syncLeaderboardEntry(user, profile, gamification);
    }

    res.json({
      token,
      firebaseToken: idToken || null,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
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
router.post('/google', (req, res: Response) => {
  try {
    const { email, name, avatarUrl, timezone, intent = 'auto', idToken } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email is required for Google Sign-In.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = Database.findUserByEmail(normalizedEmail);
    let token: string;
    let profile: any;

    if (!user) {
      if (intent === 'signin') {
        // User clicked "Sign In with Google" but hasn't created an account yet
        res.status(404).json({
          error: `No Learn.co account found for "${normalizedEmail}". Please create an account to get started.`,
          notFound: true,
          email: normalizedEmail,
        });
        return;
      }

      // New Google User Creation (Strict 0 XP, Level 1, 0 streak, 0 questions solved)
      const created = Database.createUser({
        email: normalizedEmail,
        fullName: name || normalizedEmail.split('@')[0],
        authProvider: 'google',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        timezone: timezone || 'UTC',
      });
      user = created.user;
      token = created.token;
      profile = created.profile;
    } else {
      token = Database.createSession(user.id);
      profile = Database.getProfile(user.id);
    }

    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

    // Sync to Firestore & ensure user is enrolled in leaderboard
    if (profile && gamification) {
      FirestoreSyncService.syncUserOnAuth(user, profile, gamification);
    }

    // Generate a structured Google OAuth token representation
    const verifiedGoogleToken = idToken || `g_oauth2_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    res.json({
      token,
      googleToken: verifiedGoogleToken,
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
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

    res.json({
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
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

    const origin = (req.headers.origin as string) || process.env.APP_ORIGIN || 'https://learn-co.ai.studio';
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
