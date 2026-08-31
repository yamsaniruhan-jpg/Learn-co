import { Router, Response } from 'express';
import { Database } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/user/profile
router.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = Database.getProfile(userId);
    const gamification = Database.getGamification(userId);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    res.json({ profile, gamification });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch profile.' });
  }
});

// PUT /api/user/profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      fullName,
      displayName,
      avatarUrl,
      educationLevel,
      targetExam,
      targetScore,
      examDate,
      subjects,
      learningGoals,
      preferredStudyTimeMinutes,
      timezone,
      bio,
      institution,
    } = req.body;

    const updated = Database.updateProfile(userId, {
      fullName,
      displayName,
      avatarUrl,
      educationLevel,
      targetExam,
      targetScore,
      examDate,
      subjects,
      learningGoals,
      preferredStudyTimeMinutes,
      timezone,
      bio,
      institution,
    });

    res.json({
      success: true,
      profile: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

// GET /api/user/settings
router.get('/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const settings = Database.getSettings(userId);
    if (!settings) {
      res.status(404).json({ error: 'Settings not found.' });
      return;
    }
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings.' });
  }
});

// PUT /api/user/settings
router.put('/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const updated = Database.updateSettings(userId, req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update settings.' });
  }
});

// POST /api/user/avatar
router.post('/avatar', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { imageData, avatarUrl } = req.body;

    let finalUrl = avatarUrl;

    if (imageData) {
      // Validate Data URI format: data:image/(png|jpeg|webp);base64,...
      const match = imageData.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
      if (!match) {
        res.status(400).json({
          error: 'Invalid file format. Please upload a PNG, JPEG, or WebP image.',
        });
        return;
      }

      const mimeType = match[1];
      const base64Data = match[3];

      // Validate file size (Max 2MB = ~2.7MB base64 string length)
      const bufferLength = Buffer.byteLength(base64Data, 'base64');
      const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

      if (bufferLength > MAX_SIZE_BYTES) {
        res.status(400).json({
          error: `File size exceeds the 2MB limit (Uploaded size: ${(bufferLength / (1024 * 1024)).toFixed(2)}MB).`,
        });
        return;
      }

      finalUrl = imageData; // Persist validated base64 data URI
    } else if (!finalUrl || typeof finalUrl !== 'string') {
      res.status(400).json({ error: 'Please provide valid image data or URL.' });
      return;
    }

    const updated = Database.updateProfile(userId, { avatarUrl: finalUrl });

    res.json({
      success: true,
      avatarUrl: updated.avatarUrl,
      profile: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to upload profile image.' });
  }
});

// GET /api/user/stats
router.get('/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const statistics = Database.getUserStatistics(userId);
    res.json({ statistics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to calculate user statistics.' });
  }
});

// GET /api/user/mistakes
router.get('/mistakes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { subject } = req.query;
    const mistakes = Database.getMistakes(userId, subject as string);
    res.json({ mistakes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch mistake notebook.' });
  }
});

// GET /api/user/xp-history
router.get('/xp-history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const transactions = Database.getUserXpTransactions(userId);
    res.json({ transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch XP transactions.' });
  }
});

export default router;
