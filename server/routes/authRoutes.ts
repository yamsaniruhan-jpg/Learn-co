import { Router, Response } from 'express';
import { Database, hashPassword } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OnboardingStatus } from '../../src/types/auth';
import { FirestoreSyncService } from '../services/firestoreSync';

const router = Router();

// POST /api/auth/signup
router.post('/signup', (req, res: Response) => {
  try {
    const { email, password, fullName, timezone } = req.body;

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
    const { email, password } = req.body;

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
      const hashed = hashPassword(password);
      if (user.passwordHash !== hashed) {
        res.status(401).json({ error: 'Incorrect password for this account. Please try again.' });
        return;
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

export default router;
