import { Router, Request, Response } from 'express';
import { Database } from '../db';
import { MentorMatchEngine } from '../services/mentorMatchEngine';
import { AdaptiveAnalyticsEngine } from '../services/adaptiveAnalyticsEngine';

export const mentorshipRouter = Router();

// Middleware to extract user ID from auth headers / fallback for demo
function getUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = Database.getDb().sessions[token];
    if (session && new Date(session.expiresAt) > new Date()) {
      return session.userId;
    }
  }
  return 'user-alex-001'; // Default active learner
}

// 1. GET /api/mentorship/mentors - Browse/search mentor directory
mentorshipRouter.get('/mentors', (req: Request, res: Response) => {
  try {
    const { search, subjectId, track, format, sortBy, page, limit } = req.query;
    const result = Database.listMentors({
      search: search as string,
      subjectId: subjectId as any,
      track: track as string,
      format: format as string,
      sortBy: sortBy as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 12,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /api/mentorship/mentors/:id - Get specific mentor public profile
mentorshipRouter.get('/mentors/:id', (req: Request, res: Response) => {
  try {
    const mentor = Database.getMentor(req.params.id);
    if (!mentor) {
      return res.status(404).json({ success: false, error: 'Mentor not found' });
    }
    res.json({ success: true, mentor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/mentorship/mentors/profile - Create or update mentor profile
mentorshipRouter.post('/mentors/profile', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const profile = Database.createOrUpdateMentorProfile(userId, req.body);
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET /api/mentorship/recommendations - Multi-factor mentor matching
mentorshipRouter.get('/recommendations', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const userProfile = Database.getProfile(userId);
    const allMentors = Object.values(Database.getDb().mentorProfiles);
    const mistakes = Database.getDb().mistakes.filter((m) => m.userId === userId);

    if (!userProfile) {
      return res.json({ success: true, recommendations: [] });
    }

    const subjectFilter = req.query.subjectId as any;
    const recommendations = MentorMatchEngine.computeRecommendations({
      learnerProfile: userProfile,
      mistakes,
      allMentors,
      subjectFilter,
    });

    res.json({ success: true, recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST /api/mentorship/requests - Submit mentorship request
mentorshipRouter.post('/requests', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { mentorId, subjectId, targetTrack, goalDescription, initialMessage, preferredCadence } = req.body;

    if (!mentorId || !subjectId || !goalDescription || !initialMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: mentorId, subjectId, goalDescription, initialMessage',
      });
    }

    const { request, error } = Database.createMentorshipRequest(userId, {
      mentorId,
      subjectId,
      targetTrack,
      goalDescription,
      initialMessage,
      preferredCadence,
    });

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    res.status(201).json({ success: true, request });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/mentorship/requests - List requests for current user
mentorshipRouter.get('/requests', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const requests = Database.listMentorshipRequests(userId);
    res.json({ success: true, ...requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. POST /api/mentorship/requests/:id/respond - Accept/decline request
mentorshipRouter.post('/requests/:id/respond', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { action, note } = req.body;

    if (action !== 'ACCEPT' && action !== 'DECLINE') {
      return res.status(400).json({ success: false, error: 'Action must be ACCEPT or DECLINE' });
    }

    const result = Database.respondMentorshipRequest(userId, req.params.id, action, note);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, request: result.request, relationship: result.relationship });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. POST /api/mentorship/requests/:id/cancel - Cancel a pending request
mentorshipRouter.post('/requests/:id/cancel', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const ok = Database.cancelMentorshipRequest(userId, req.params.id);
    if (!ok) {
      return res.status(400).json({ success: false, error: 'Could not cancel request' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. GET /api/mentorship/relationships - List relationships
mentorshipRouter.get('/relationships', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const relationships = Database.listMentorshipRelationships(userId);
    res.json({ success: true, relationships });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. GET /api/mentorship/relationships/:id - Get specific relationship details
mentorshipRouter.get('/relationships/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const relationship = Database.getMentorshipRelationship(userId, req.params.id);
    if (!relationship) {
      return res.status(404).json({ success: false, error: 'Relationship not found or access denied' });
    }
    res.json({ success: true, relationship });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. PATCH /api/mentorship/relationships/:id/status - Update relationship status
mentorshipRouter.patch('/relationships/:id/status', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body;
    const rel = Database.updateMentorshipStatus(userId, req.params.id, status);
    if (!rel) {
      return res.status(404).json({ success: false, error: 'Relationship not found or unauthorized' });
    }
    res.json({ success: true, relationship: rel });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. PATCH /api/mentorship/relationships/:id/privacy - Update granular privacy
mentorshipRouter.patch('/relationships/:id/privacy', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = Database.updateMentorshipPrivacy(userId, req.params.id, req.body);
    if (!settings) {
      return res.status(403).json({ success: false, error: 'Only the learner can adjust privacy settings' });
    }
    res.json({ success: true, privacySettings: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. GET /api/mentorship/relationships/:id/insights - Authorized learner diagnostics
mentorshipRouter.get('/relationships/:id/insights', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const insights = Database.getAuthorizedLearnerInsights(userId, req.params.id);
    if (!insights) {
      return res.status(404).json({ success: false, error: 'Relationship not found or unauthorized' });
    }
    res.json({ success: true, insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 14. GET /api/mentorship/relationships/:id/messages - Message history
mentorshipRouter.get('/relationships/:id/messages', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const messages = Database.listMentorshipMessages(userId, req.params.id);
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15. POST /api/mentorship/relationships/:id/messages - Send message
mentorshipRouter.post('/relationships/:id/messages', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { content, attachedResource } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const message = Database.addMentorshipMessage(userId, req.params.id, {
      content,
      attachedResource,
    });

    if (!message) {
      return res.status(403).json({ success: false, error: 'Cannot send message to this relationship' });
    }

    res.status(201).json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 16. POST /api/mentorship/relationships/:id/messages/read - Mark messages as read
mentorshipRouter.post('/relationships/:id/messages/read', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const updated = Database.markMentorshipMessagesAsRead(userId, req.params.id);
    res.json({ success: true, updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 17. Goals endpoints
mentorshipRouter.get('/relationships/:id/goals', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const goals = Database.listMentorshipGoals(userId, req.params.id);
    res.json({ success: true, goals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/relationships/:id/goals', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { title, description, targetDate, subjectId, linkedTopicId, linkedConceptId } = req.body;
    if (!title || !targetDate) {
      return res.status(400).json({ success: false, error: 'Title and targetDate are required' });
    }

    const goal = Database.createMentorshipGoal(userId, {
      mentorshipId: req.params.id,
      title,
      description: description || '',
      targetDate,
      subjectId,
      linkedTopicId,
      linkedConceptId,
    });

    if (!goal) {
      return res.status(403).json({ success: false, error: 'Unauthorized or relationship not found' });
    }

    res.status(201).json({ success: true, goal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.patch('/goals/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const goal = Database.updateMentorshipGoal(userId, req.params.id, req.body);
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found or unauthorized' });
    }
    res.json({ success: true, goal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 18. Tasks endpoints
mentorshipRouter.get('/relationships/:id/tasks', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const tasks = Database.listMentorshipTasks(userId, req.params.id);
    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/relationships/:id/tasks', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { title, description, dueDate, subjectId, linkedTopicId, linkedResource } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ success: false, error: 'Title and dueDate are required' });
    }

    const task = Database.createMentorshipTask(userId, {
      mentorshipId: req.params.id,
      title,
      description: description || '',
      dueDate,
      subjectId,
      linkedTopicId,
      linkedResource,
    });

    if (!task) {
      return res.status(403).json({ success: false, error: 'Unauthorized or relationship not found' });
    }

    res.status(201).json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.patch('/tasks/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const task = Database.updateMentorshipTask(userId, req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found or unauthorized' });
    }
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 19. Sessions endpoints
mentorshipRouter.get('/sessions', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const relationshipId = req.query.mentorshipId as string;
    const sessions = Database.listMentorshipSessions(userId, relationshipId);
    res.json({ success: true, sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/sessions', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { mentorshipId, title, scheduledDate, startTime, durationMinutes, topicsCovered, sharedNotes } = req.body;

    if (!mentorshipId || !title || !scheduledDate || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: mentorshipId, title, scheduledDate, startTime',
      });
    }

    const session = Database.createMentorshipSession(userId, {
      mentorshipId,
      title,
      scheduledDate,
      startTime,
      durationMinutes,
      topicsCovered,
      sharedNotes,
    });

    if (!session) {
      return res.status(403).json({ success: false, error: 'Unauthorized or relationship not found' });
    }

    res.status(201).json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.patch('/sessions/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const session = Database.updateMentorshipSession(userId, req.params.id, req.body);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or unauthorized' });
    }
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 20. Feedback & Reporting
mentorshipRouter.post('/feedback', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const {
      mentorshipId,
      sessionId,
      receiverId,
      overallRating,
      pedagogicalClarityRating,
      responsivenessRating,
      domainMasteryRating,
      feedbackText,
      isAnonymous,
      isPublicOnProfile,
    } = req.body;

    if (!mentorshipId || !receiverId || !overallRating || !feedbackText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: mentorshipId, receiverId, overallRating, feedbackText',
      });
    }

    const feedback = Database.addMentorshipFeedback(userId, {
      mentorshipId,
      sessionId,
      receiverId,
      overallRating,
      pedagogicalClarityRating,
      responsivenessRating,
      domainMasteryRating,
      feedbackText,
      isAnonymous,
      isPublicOnProfile,
    });

    if (!feedback) {
      return res.status(403).json({ success: false, error: 'Could not record feedback' });
    }

    res.status(201).json({ success: true, feedback });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/reports', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { reportedUserId, mentorshipId, reason, details } = req.body;

    if (!reportedUserId || !reason || !details) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportedUserId, reason, details',
      });
    }

    const report = Database.addMentorshipReport(userId, {
      reportedUserId,
      mentorshipId,
      reason,
      details,
    });

    res.status(201).json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 21. GET /api/mentorship/mentor-dashboard - Educator dashboard view
mentorshipRouter.get('/mentor-dashboard', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dashboard = Database.getMentorDashboard(userId);
    res.json({ success: true, ...dashboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 22. GET /api/mentorship/relationships/:id/mentee-analytics - Authorized mentee performance data
mentorshipRouter.get('/relationships/:id/mentee-analytics', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const relationship = Database.getMentorshipRelationship(userId, req.params.id);

    if (!relationship) {
      return res.status(404).json({ success: false, error: 'Mentorship relationship not found or unauthorized' });
    }

    // Only allow participants in the relationship
    if (relationship.mentorId !== userId && relationship.learnerId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this mentee analytics' });
    }

    const menteeId = relationship.learnerId;
    const analytics = AdaptiveAnalyticsEngine.getDashboard(menteeId);
    const masteryList = AdaptiveAnalyticsEngine.getConceptMasteries(menteeId);

    res.json({
      success: true,
      data: {
        menteeId,
        menteeName: relationship.learnerName,
        subjectId: relationship.subjectId,
        masteryMatrix: analytics.subjectSummaries,
        criticalGaps: analytics.examReadiness.criticalGaps,
        weakAreas: masteryList.filter((m) => m.isWeakArea),
        examReadiness: analytics.examReadiness,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

