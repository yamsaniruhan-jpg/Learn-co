import { Router, Request, Response } from 'express';
import { Database } from '../db';
import { requireAuth, getEffectiveRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { MentorMatchEngine } from '../services/mentorMatchEngine';
import { AdaptiveAnalyticsEngine } from '../services/adaptiveAnalyticsEngine';
// Legacy CommonJS service (its folder is marked "type": "commonjs").
import mentorshipService from '../../services/mentorshipService';
import { adminDb } from '../services/firebaseAdmin';
import { sendMail, isMailerConfigured } from '../services/mailer';
import {
  createSqlMentorApplication,
  listSqlMentorApplications,
  listSqlMentorApplicationsByApplicant,
  getSqlMentorApplication,
  decideSqlMentorApplication,
  upsertSqlMentorProfile,
  MentorApplicationRecord,
} from '../../src/db/mentorApplications.ts';
import { PLATFORM_OWNER_EMAIL, updateSqlUserRole } from '../../src/db/users.ts';

export const mentorshipRouter = Router();

function isPlatformOwnerOrAdmin(req: AuthenticatedRequest): boolean {
  return getEffectiveRole(req) === 'admin';
}

// Public mentor directory endpoints are declared first; all routes below require auth.

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

// All private and mutating mentorship routes require authentication
mentorshipRouter.use(requireAuth);

// 3. POST /api/mentorship/mentors/profile - Create or update mentor profile (educator/admin only)
mentorshipRouter.post('/mentors/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userProfile = Database.getProfile(userId);
    const effectiveRole = getEffectiveRole(req);
    if (effectiveRole !== 'educator' && effectiveRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Mentor accreditation is required before publishing a mentor profile. Please submit an application for owner review.',
      });
    }
    const profile = Database.createOrUpdateMentorProfile(userId, req.body);
    try {
      await upsertSqlMentorProfile({
        mentorId: profile.id,
        userId,
        email: req.user?.email || userProfile?.email || '',
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        headline: profile.headline,
        education: profile.education,
        subjects: profile.subjects,
        teachingExperienceYears: profile.teachingExperienceYears,
        maxMentees: profile.maxMentees,
        hourlyRate: 0,
        bio: profile.bio,
      });
    } catch (sqlErr) {
      console.warn('[CloudSQL] Mentor profile mirror skipped:', sqlErr);
    }
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================================
// MENTOR APPLICATIONS (POSTGRESQL + FIRESTORE + OWNER ROUTING)
// ==========================================================

// 3a. POST /api/mentorship/applications - Submit a formal mentor application directly to platform owner
mentorshipRouter.post('/applications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userProfile = Database.getProfile(userId);
    const applicantEmail = (req.user?.email || userProfile?.email || '').trim().toLowerCase();
    const {
      fullName,
      degree,
      institution,
      subject,
      subjectId,
      experienceYears,
      capacity,
      hourlyRate,
      bio,
    } = req.body || {};

    const cleanName = String(fullName || userProfile?.fullName || userProfile?.displayName || '').trim();
    const cleanDegree = String(degree || '').trim();
    const cleanInstitution = String(institution || '').trim();
    const cleanSubject = String(subjectId || subject || 'math').trim();
    const cleanBio = String(bio || '').trim();
    const parsedExp = Math.max(0, Math.min(60, Number(experienceYears) || 0));
    const parsedCapacity = Math.max(1, Math.min(50, Number(capacity) || 5));
    const parsedRate = Math.max(0, Math.min(1000, Number(hourlyRate) || 0));

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide your full name.' });
    }
    if (!cleanDegree || cleanDegree.length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide your academic degree or credentials.' });
    }
    if (!cleanInstitution || cleanInstitution.length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide your affiliation or university.' });
    }
    if (!cleanBio || cleanBio.length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Please write a brief mentorship statement (at least 15 characters).',
      });
    }

    let record: MentorApplicationRecord | null = null;
    try {
      record = await createSqlMentorApplication({
        applicantUid: userId,
        applicantEmail: applicantEmail || `${userId}@learnco.local`,
        fullName: cleanName,
        degree: cleanDegree,
        institution: cleanInstitution,
        subjectId: cleanSubject,
        experienceYears: parsedExp,
        capacity: parsedCapacity,
        hourlyRate: parsedRate,
        bio: cleanBio,
      });
    } catch (sqlErr: any) {
      console.error('[Mentorship] Cloud SQL application insert error:', sqlErr?.message || sqlErr);
      return res.status(503).json({
        success: false,
        error: 'Unable to save application to PostgreSQL right now. Please try again shortly.',
      });
    }

    if (!record) {
      const nowIso = new Date().toISOString();
      record = {
        id: `mapp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        applicantUid: userId,
        applicantEmail: applicantEmail || `${userId}@learnco.local`,
        fullName: cleanName,
        degree: cleanDegree,
        institution: cleanInstitution,
        subjectId: cleanSubject,
        experienceYears: parsedExp,
        capacity: parsedCapacity,
        hourlyRate: parsedRate,
        bio: cleanBio,
        status: 'PENDING',
        routedToEmail: PLATFORM_OWNER_EMAIL,
        reviewerEmail: null,
        reviewerNote: null,
        reviewedAt: null,
        submittedAt: nowIso,
        updatedAt: nowIso,
      };
    }

    // Persist in local store snapshot as well
    Database.saveMentorApplication(record);

    // Mirror to Firebase Firestore console
    if (adminDb) {
      try {
        await adminDb.collection('mentor_applications').doc(record.id).set({
          ...record,
          createdAt: record.submittedAt,
        });
        await adminDb.collection('notifications').add({
          userId: PLATFORM_OWNER_EMAIL,
          type: 'mentor_application',
          applicationId: record.id,
          applicantName: record.fullName,
          applicantEmail: record.applicantEmail,
          message: `New mentor application from ${record.fullName} (${record.applicantEmail}) for ${record.subjectId.toUpperCase()}.`,
          read: false,
          createdAt: record.submittedAt,
        });
      } catch (fbErr: any) {
        console.warn('[Firestore] Mentor application sync skipped:', fbErr?.message || fbErr);
      }
    }

    // Create owner notification & audit log
    Database.addNotification({
      id: `notif-mapp-${Date.now()}`,
      userId: PLATFORM_OWNER_EMAIL,
      type: 'mentor_prescription',
      title: `New Mentor Application: ${record.fullName}`,
      message: `${record.fullName} (${record.applicantEmail}) applied to mentor ${record.subjectId.toUpperCase()} (${record.degree}, ${record.institution}).`,
      timestamp: 'Just now',
      isRead: false,
      actionUrl: 'mentor',
    });

    Database.logEvent(
      'AUTH',
      'MENTOR_APPLICATION_SUBMITTED',
      `Mentor application ${record.id} submitted by ${record.applicantEmail} and routed to ${PLATFORM_OWNER_EMAIL}.`,
      'INFO',
      userId,
      { applicationId: record.id, routedTo: PLATFORM_OWNER_EMAIL, subjectId: record.subjectId }
    );

    // Send email notification directly to platform owner if SMTP/Resend is configured
    let emailDispatched = false;
    if (isMailerConfigured()) {
      const mailResult = await sendMail({
        to: PLATFORM_OWNER_EMAIL,
        subject: `[Learn.co] New Mentor Application from ${record.fullName}`,
        text: [
          `A new mentor application has been submitted on Learn.co and saved to PostgreSQL.`,
          '',
          `Application ID: ${record.id}`,
          `Applicant: ${record.fullName} (${record.applicantEmail})`,
          `Credentials: ${record.degree} — ${record.institution}`,
          `Subject: ${record.subjectId.toUpperCase()}`,
          `Experience: ${record.experienceYears} year(s) | Capacity: ${record.capacity} mentees | Rate: $${record.hourlyRate}/hr`,
          '',
          `Statement:`,
          record.bio,
          '',
          `Review & approve/decline in Learn.co -> Mentorship -> Mentor Access & Approvals (or Admin Studio).`,
        ].join('\n'),
      });
      emailDispatched = mailResult.delivered;
    }

    res.status(201).json({
      success: true,
      application: record,
      routedToEmail: PLATFORM_OWNER_EMAIL,
      emailDispatched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to submit mentor application.' });
  }
});

// 3b. GET /api/mentorship/applications/mine - Fetch current user's submitted applications
mentorshipRouter.get('/applications/mine', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userEmail = (req.user?.email || Database.getProfile(userId)?.email || '').trim().toLowerCase();

    let sqlApps: MentorApplicationRecord[] | null = null;
    try {
      sqlApps = await listSqlMentorApplicationsByApplicant(userId);
    } catch (sqlErr: any) {
      console.warn('[CloudSQL] Read my applications fallback:', sqlErr?.message || sqlErr);
    }

    const localApps = Database.listMentorApplicationsForApplicantLocal(userId, userEmail);
    const mergedMap = new Map<string, any>();
    for (const app of localApps) mergedMap.set(app.id, app);
    if (sqlApps) {
      for (const app of sqlApps) mergedMap.set(app.id, app);
    }

    const applications = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    res.json({
      success: true,
      applications,
      routedToEmail: PLATFORM_OWNER_EMAIL,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to load your applications.' });
  }
});

// 3c. GET /api/mentorship/applications - Owner/Admin list of all submitted mentor applications
mentorshipRouter.get('/applications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformOwnerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: `Only the platform owner (${PLATFORM_OWNER_EMAIL}) or an administrator can view all mentor applications.`,
        code: 'FORBIDDEN',
      });
    }

    let sqlApps: MentorApplicationRecord[] | null = null;
    try {
      sqlApps = await listSqlMentorApplications();
    } catch (sqlErr: any) {
      return res.status(503).json({
        success: false,
        error: sqlErr?.message || 'Unable to fetch applications from PostgreSQL.',
      });
    }

    const localApps = Database.listMentorApplicationsLocal();
    const mergedMap = new Map<string, any>();
    for (const app of localApps) mergedMap.set(app.id, app);
    if (sqlApps) {
      for (const app of sqlApps) {
        mergedMap.set(app.id, app);
        Database.saveMentorApplication(app);
      }
    }

    const applications = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    const counts = {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'PENDING').length,
      approved: applications.filter((a) => a.status === 'APPROVED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    };

    res.json({
      success: true,
      applications,
      counts,
      routedToEmail: PLATFORM_OWNER_EMAIL,
      storage: sqlApps !== null ? 'postgresql' : 'local',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to list mentor applications.' });
  }
});

// 3d. POST /api/mentorship/applications/:id/decision - Owner/Admin approve or reject application
mentorshipRouter.post('/applications/:id/decision', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformOwnerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: `Only the platform owner (${PLATFORM_OWNER_EMAIL}) or an administrator can approve or decline mentor applications.`,
        code: 'FORBIDDEN',
      });
    }

    const appId = req.params.id;
    const { action, note } = req.body || {};
    if (action !== 'APPROVE' && action !== 'REJECT') {
      return res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT.' });
    }

    const decision: 'APPROVED' | 'REJECTED' = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const reviewerEmail = (req.user?.email || PLATFORM_OWNER_EMAIL).trim().toLowerCase();

    let existing = await getSqlMentorApplication(appId).catch(() => null);
    if (!existing) {
      existing = Database.getMentorApplicationLocal(appId);
    }
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Mentor application not found.' });
    }

    let updated = await decideSqlMentorApplication(appId, decision, reviewerEmail, note).catch((err) => {
      console.error('[CloudSQL] Application decision update error:', err);
      throw err;
    });

    if (!updated) {
      updated = {
        ...existing,
        status: decision,
        reviewerEmail,
        reviewerNote: note ? String(note).trim() : null,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    Database.saveMentorApplication(updated);

    let publishedMentorProfile = null;
    if (decision === 'APPROVED') {
      // Upgrade applicant profile role unless they are already admin
      const applicantProfile = Database.getProfile(updated.applicantUid);
      if (applicantProfile && applicantProfile.role !== 'admin') {
        applicantProfile.role = 'educator';
      }
      await updateSqlUserRole(updated.applicantUid, applicantProfile?.role === 'admin' ? 'admin' : 'educator').catch(() => null);

      publishedMentorProfile = Database.createOrUpdateMentorProfile(updated.applicantUid, {
        name: updated.fullName,
        education: `${updated.degree}, ${updated.institution}`,
        subjects: [updated.subjectId as any],
        teachingExperienceYears: updated.experienceYears,
        maxMentees: updated.capacity,
        bio: updated.bio,
        headline: `${updated.degree} • ${updated.institution}`,
        credentials: ['Verified Mentor', updated.institution],
        pricingType: updated.hourlyRate > 0 ? 'pro_scholar' : 'free_community',
      });

      await upsertSqlMentorProfile({
        mentorId: publishedMentorProfile.id,
        userId: updated.applicantUid,
        email: updated.applicantEmail,
        name: updated.fullName,
        avatarUrl: publishedMentorProfile.avatarUrl,
        headline: publishedMentorProfile.headline,
        education: publishedMentorProfile.education,
        subjects: publishedMentorProfile.subjects,
        teachingExperienceYears: updated.experienceYears,
        maxMentees: updated.capacity,
        hourlyRate: updated.hourlyRate,
        bio: updated.bio,
      }).catch((err) => console.warn('[CloudSQL] Failed to mirror mentor profile:', err));

      if (adminDb) {
        try {
          await adminDb.collection('mentors').doc(publishedMentorProfile.id).set({
            id: publishedMentorProfile.id,
            userId: updated.applicantUid,
            name: updated.fullName,
            status: 'active',
            subjects: publishedMentorProfile.subjects,
            education: publishedMentorProfile.education,
            rating: publishedMentorProfile.rating,
            totalSessions: publishedMentorProfile.sessionsCompleted,
            updatedAt: updated.updatedAt,
          });
        } catch (fbErr) {
          console.warn('[Firestore] Mentor publish sync skipped:', fbErr);
        }
      }
    }

    // Mirror decision to Firestore
    if (adminDb) {
      try {
        await adminDb.collection('mentor_applications').doc(updated.id).set(updated, { merge: true });
      } catch (fbErr) {
        console.warn('[Firestore] Application decision sync skipped:', fbErr);
      }
    }

    Database.logEvent(
      'AUTH',
      `MENTOR_APPLICATION_${decision}`,
      `Application ${updated.id} (${updated.applicantEmail}) marked ${decision} by ${reviewerEmail}.`,
      decision === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      req.userId,
      { applicationId: updated.id, applicantUid: updated.applicantUid }
    );

    if (isMailerConfigured() && updated.applicantEmail) {
      void sendMail({
        to: updated.applicantEmail,
        subject:
          decision === 'APPROVED'
            ? '[Learn.co] Your Mentor Application Has Been Approved'
            : '[Learn.co] Update on Your Mentor Application',
        text:
          decision === 'APPROVED'
            ? `Congratulations ${updated.fullName}! Your Learn.co Mentor Application has been approved. Your Educator Portal and public Mentor profile are now active.`
            : `Hello ${updated.fullName}, thank you for applying to mentor on Learn.co. Your application was not approved at this time.${updated.reviewerNote ? `\n\nReviewer Note: ${updated.reviewerNote}` : ''}`,
      });
    }

    res.json({
      success: true,
      application: updated,
      mentorProfile: publishedMentorProfile,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to record decision.' });
  }
});

// 4. GET /api/mentorship/recommendations - Multi-factor mentor matching
mentorshipRouter.get('/recommendations', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const requests = Database.listMentorshipRequests(userId);
    res.json({ success: true, ...requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. POST /api/mentorship/requests/:id/respond - Accept/decline request
mentorshipRouter.post('/requests/:id/respond', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const relationships = Database.listMentorshipRelationships(userId);
    res.json({ success: true, relationships });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. GET /api/mentorship/relationships/:id - Get specific relationship details
mentorshipRouter.get('/relationships/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const messages = Database.listMentorshipMessages(userId, req.params.id);
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15. POST /api/mentorship/relationships/:id/messages - Send message
mentorshipRouter.post('/relationships/:id/messages', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const updated = Database.markMentorshipMessagesAsRead(userId, req.params.id);
    res.json({ success: true, updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 17. Goals endpoints
mentorshipRouter.get('/relationships/:id/goals', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const goals = Database.listMentorshipGoals(userId, req.params.id);
    res.json({ success: true, goals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/relationships/:id/goals', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const tasks = Database.listMentorshipTasks(userId, req.params.id);
    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/relationships/:id/tasks', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const relationshipId = req.query.mentorshipId as string;
    const sessions = Database.listMentorshipSessions(userId, relationshipId);
    res.json({ success: true, sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mentorshipRouter.post('/sessions', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
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
    const userId = (req as AuthenticatedRequest).userId!;
    const dashboard = Database.getMentorDashboard(userId);
    res.json({ success: true, ...dashboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 22. GET /api/mentorship/relationships/:id/mentee-analytics - Authorized mentee performance data
mentorshipRouter.get('/relationships/:id/mentee-analytics', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
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

// 23. POST /api/mentorship/find-mentors
mentorshipRouter.post('/find-mentors', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId!;
    const mentors = await mentorshipService.findMentors(uid, req.body);
    res.json({ mentors });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to find mentors.' });
  }
});

// 24. POST /api/mentorship/book-session
mentorshipRouter.post('/book-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId!;
    const sessionId = await mentorshipService.bookSession(uid, req.body.mentorId, req.body);
    res.status(201).json({ sessionId, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to book session.' });
  }
});

// 25. GET /api/mentorship/my-sessions
mentorshipRouter.get('/my-sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.userId!;
    let sessions: any[] = [];

    try {
      if (!adminDb) throw new Error('Firestore is not configured; using local store only.');
      const snap = await adminDb
        .collection('sessions')
        .where('learnerUid', '==', uid)
        .orderBy('date', 'desc')
        .limit(20)
        .get();
      sessions = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      // Firestore is optional: the local JSON store remains authoritative.
      console.warn('Firestore fetch sessions fallback:', e?.message);
    }

    if (!sessions.length) {
      const dbSessions = Database.listMentorshipSessions(uid);
      sessions = dbSessions.map((s) => ({
        id: s.id,
        learnerUid: uid,
        mentorId: s.mentorId,
        date: s.scheduledDate,
        duration: s.durationMinutes,
        topic: s.title || (s.topicsCovered && s.topicsCovered[0]) || 'STEM Mentorship',
        status: s.status,
      }));
    }

    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch sessions.' });
  }
});

