import { Router, Response } from 'express';
import { Database, hashPassword } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OnboardingStatus } from '../../src/types/auth';

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

    const user = Database.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    if (user.authProvider === 'email') {
      const hashed = hashPassword(password);
      if (user.passwordHash !== hashed) {
        res.status(401).json({ error: 'Invalid email or password credentials.' });
        return;
      }
    }

    const token = Database.createSession(user.id);
    const profile = Database.getProfile(user.id);
    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

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
    const { email, name, avatarUrl, timezone } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required for Google Sign-In.' });
      return;
    }

    let user = Database.findUserByEmail(email);
    let token: string;
    let profile: any;

    if (!user) {
      // New Google User
      const created = Database.createUser({
        email,
        fullName: name || email.split('@')[0],
        authProvider: 'google',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
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
