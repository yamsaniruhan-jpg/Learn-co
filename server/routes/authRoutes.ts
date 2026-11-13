import { Router, Response } from 'express';
import { Database, hashPassword, verifyPassword } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OnboardingStatus } from '../../src/types/auth';
import { FirestoreSyncService } from '../services/firestoreSync';
import { adminAuth } from '../services/firebaseAdmin';

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

    if (settings && settings.privacy) {
      settings.privacy.leaderboardVisibility = true;
    }

    Database.saveToDisk();

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
router.post('/google', async (req, res: Response) => {
  try {
    const { email, name, avatarUrl, timezone, intent = 'auto', idToken } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email is required for Google Sign-In.' });
      return;
    }

    let verifiedEmail = email.trim().toLowerCase();

    // When Firebase Admin is configured and an idToken is provided, verify it cryptographically.
    // Note: Simulated preview tokens from GoogleSignInDialog contain '.mock_sig_' when Firebase client auth isn't used.
    if (adminAuth && typeof adminAuth.verifyIdToken === 'function' && idToken && !String(idToken).includes('.mock_sig_')) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken, false);
        if (decoded.email) {
          if (decoded.email.trim().toLowerCase() !== verifiedEmail) {
            res.status(401).json({ error: 'Google token email does not match request email.' });
            return;
          }
          verifiedEmail = decoded.email.trim().toLowerCase();
        }
      } catch {
        res.status(401).json({ error: 'Invalid or expired Google ID token.' });
        return;
      }
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

    const gamification = Database.getGamification(user.id);
    const settings = Database.getSettings(user.id);

    if (profile && gamification) {
      FirestoreSyncService.syncUserOnAuth(user, profile, gamification);
    }

    res.json({
      token,
      googleToken: idToken || null,
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
