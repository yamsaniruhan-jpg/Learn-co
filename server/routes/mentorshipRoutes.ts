import { Router, Request, Response } from 'express';
import { Database } from '../db';
import { requireAuth, getEffectiveRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { MentorMatchEngine } from '../services/mentorMatchEngine';
import { AdaptiveAnalyticsEngine } from '../services/adaptiveAnalyticsEngine';
// Legacy CommonJS service (its folder is marked "type": "commonjs").
import mentorshipService from '../../services/mentorshipService';
import { adminDb } from '../services/firebaseAdmin';
import {
  sendMail,
  isMailerConfigured,
  getMailerStatus,
  getConfiguredAppOrigin,
  buildMailtoUrl,
  isValidEmailAddress,
  createMentorshipEmailActionToken,
  verifyMentorshipEmailActionToken,
  buildMentorApplicationMessage,
  buildMentorApplicationDecisionMessage,
  buildMentorshipRequestMessage,
  buildMentorshipResponseToStudentMessage,
} from '../services/mailer';
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

function escapeHtmlSafe(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailActionHtml(params: {
  title: string;
  subtitle: string;
  bodyHtml: string;
  accent?: string;
}): string {
  const accent = params.accent || '#059669';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtmlSafe(params.title)} — Learn.co</title>
</head>
<body style="margin:0;padding:32px 16px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;">
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:28px;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
    <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${accent}1a;color:${accent};font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:12px;">
      Learn.co Mentorship
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">${escapeHtmlSafe(params.title)}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">${escapeHtmlSafe(params.subtitle)}</p>
    ${params.bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
      You can close this tab or <a href="/" style="color:#4f46e5;font-weight:600;text-decoration:none;">open Learn.co</a>.
    </p>
  </div>
</body>
</html>`;
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

// 2a. GET /api/mentorship/mail-status - Truthful email relay capability check
mentorshipRouter.get('/mail-status', (_req: Request, res: Response) => {
  res.json({ success: true, ...getMailerStatus() });
});

// 2b. GET /api/mentorship/requests/:id/email-respond - Signed confirmation page from mentor's email click
mentorshipRouter.get('/requests/:id/email-respond', (req: Request, res: Response) => {
  const token = String(req.query?.token || '').trim();
  const verified = verifyMentorshipEmailActionToken(token, req.params.id);
  if (verified.valid === false) {
    const reason = (verified as { valid: false; reason: string }).reason;
    return res
      .status(400)
      .type('html')
      .send(
        renderEmailActionHtml({
          title: 'Invalid or Expired Mentorship Link',
          subtitle: reason,
          accent: '#e11d48',
          bodyHtml:
            '<p style="font-size:13px;color:#475569;">Please sign in to Learn.co and open <strong>Mentorship → Educator Portal</strong> to respond to pending requests.</p>',
        })
      );
  }

  const request = Database.getMentorshipRequestById(req.params.id);
  if (!request) {
    return res
      .status(404)
      .type('html')
      .send(
        renderEmailActionHtml({
          title: 'Mentorship Request Not Found',
          subtitle: 'This request may have been cancelled by the student.',
          accent: '#e11d48',
          bodyHtml: '',
        })
      );
  }

  if (request.status !== 'PENDING') {
    return res
      .status(200)
      .type('html')
      .send(
        renderEmailActionHtml({
          title: `Request Already ${request.status}`,
          subtitle: `You already responded to ${request.learnerName}'s mentorship request.`,
          accent: request.status === 'ACCEPTED' ? '#059669' : '#64748b',
          bodyHtml: `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;font-size:13px;">
            <div><strong>Student:</strong> ${escapeHtmlSafe(request.learnerName)}</div>
            <div><strong>Subject:</strong> ${escapeHtmlSafe(request.subjectId.toUpperCase())}</div>
            <div><strong>Status:</strong> ${escapeHtmlSafe(request.status)}</div>
          </div>`,
        })
      );
  }

  const isAccept = verified.action === 'ACCEPT';
  return res
    .status(200)
    .type('html')
    .send(
      renderEmailActionHtml({
        title: isAccept ? 'Confirm Accepting Student?' : 'Confirm Declining Request?',
        subtitle: `${request.learnerName}${request.learnerEmail ? ` (${request.learnerEmail})` : ''} requested mentorship in ${request.subjectId.toUpperCase()}.`,
        accent: isAccept ? '#059669' : '#e11d48',
        bodyHtml: `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:18px;font-size:13px;line-height:1.6;">
            <div><strong>Track:</strong> ${escapeHtmlSafe(request.targetTrack)}</div>
            <div><strong>Cadence:</strong> ${escapeHtmlSafe(request.preferredCadence)}</div>
            <div><strong>Goal:</strong> ${escapeHtmlSafe(request.goalDescription)}</div>
            <div style="margin-top:8px;"><strong>Message:</strong> ${escapeHtmlSafe(request.initialMessage)}</div>
          </div>
          <form method="POST" action="/api/mentorship/requests/${encodeURIComponent(req.params.id)}/email-respond" style="space-y:12px;">
            <input type="hidden" name="token" value="${escapeHtmlSafe(token)}" />
            <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:#334155;">Optional Note to Student</label>
            <textarea name="note" rows="3" placeholder="Write a quick welcome or scheduling note..." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:13px;margin-bottom:14px;"></textarea>
            <button type="submit" style="width:100%;padding:12px 18px;border:none;border-radius:12px;background:${isAccept ? '#059669' : '#e11d48'};color:#ffffff;font-weight:700;font-size:14px;cursor:pointer;">
              ${isAccept ? 'Yes, Accept Student as Mentee' : 'Confirm Decline Request'}
            </button>
          </form>
        `,
      })
    );
});

// 2c. POST /api/mentorship/requests/:id/email-respond - Executes mentor's signed email click Yes/Decline
mentorshipRouter.post('/requests/:id/email-respond', async (req: Request, res: Response) => {
  const token = String(req.body?.token || req.query?.token || '').trim();
  const note = typeof req.body?.note === 'string' && req.body.note.trim() ? req.body.note.trim() : undefined;
  const wantsJson = Boolean(req.headers.accept?.includes('application/json'));

  const verified = verifyMentorshipEmailActionToken(token, req.params.id);
  if (verified.valid === false) {
    const reason = (verified as { valid: false; reason: string }).reason;
    if (wantsJson) {
      return res.status(400).json({ success: false, error: reason });
    }
    return res
      .status(400)
      .type('html')
      .send(
        renderEmailActionHtml({
          title: 'Invalid or Expired Link',
          subtitle: reason,
          accent: '#e11d48',
          bodyHtml: '',
        })
      );
  }

  const result = Database.respondMentorshipRequestByEmailAction(
    req.params.id,
    verified.mentorId,
    verified.action,
    note
  );

  if (result.error && !result.alreadyProcessed) {
    if (wantsJson) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res
      .status(400)
      .type('html')
      .send(
        renderEmailActionHtml({
          title: 'Could Not Process Request',
          subtitle: result.error,
          accent: '#e11d48',
          bodyHtml: '',
        })
      );
  }

  let emailDispatched = false;
  if (result.request && !result.alreadyProcessed) {
    if (adminDb) {
      try {
        await adminDb.collection('mentorship_requests').doc(result.request.id).set(result.request, { merge: true });
        if (result.relationship) {
          await adminDb.collection('mentorship_relationships').doc(result.relationship.id).set(result.relationship);
        }
      } catch (fbErr) {
        console.warn('[Firestore] Email-action mentorship mirror skipped:', fbErr);
      }
    }

    const studentEmail = result.request.learnerEmail;
    if (studentEmail && isValidEmailAddress(studentEmail) && isMailerConfigured()) {
      const mailRes = await sendMail(
        buildMentorshipResponseToStudentMessage({
          studentEmail,
          studentName: result.request.learnerName,
          mentorName: result.request.mentorName,
          mentorEmail: result.request.mentorEmail,
          subjectId: result.request.subjectId,
          action: verified.action,
          note,
        })
      );
      emailDispatched = mailRes.delivered;
    }
  }

  if (wantsJson) {
    return res.json({
      success: true,
      request: result.request,
      relationship: result.relationship,
      alreadyProcessed: !!result.alreadyProcessed,
      emailDispatched,
    });
  }

  const isAccept = verified.action === 'ACCEPT';
  return res
    .status(200)
    .type('html')
    .send(
      renderEmailActionHtml({
        title: result.alreadyProcessed
          ? `Request Already ${result.request?.status}`
          : isAccept
          ? 'Student Accepted!'
          : 'Request Declined',
        subtitle: result.alreadyProcessed
          ? 'No duplicate changes were made.'
          : isAccept
          ? `${result.request?.learnerName} is now in your active mentee cohort.`
          : `You declined ${result.request?.learnerName}'s request.`,
        accent: isAccept ? '#059669' : '#64748b',
        bodyHtml: `<p style="font-size:13px;color:#475569;line-height:1.6;">
          ${emailDispatched ? 'An acceptance email has also been delivered to the student.' : 'Your response has been saved in Learn.co.'}
        </p>`,
      })
    );
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
      console.warn('[Mentorship] Cloud SQL application insert fallback:', sqlErr?.message || sqlErr);
      record = null;
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
    let firestoreSynced = false;
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
        firestoreSynced = true;
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

    const appMessage = buildMentorApplicationMessage({
      ownerEmail: PLATFORM_OWNER_EMAIL,
      applicationId: record.id,
      fullName: record.fullName,
      applicantEmail: record.applicantEmail,
      degree: record.degree,
      institution: record.institution,
      subjectId: record.subjectId,
      experienceYears: record.experienceYears,
      capacity: record.capacity,
      hourlyRate: record.hourlyRate,
      bio: record.bio,
    });
    const mailtoUrl = buildMailtoUrl(PLATFORM_OWNER_EMAIL, appMessage.subject, appMessage.text);

    // Send email notification directly to platform owner if SMTP/Resend is configured
    let emailDispatched = false;
    let emailProvider: string = 'none';
    let emailReason: string | undefined = isMailerConfigured() ? undefined : 'not_configured';

    if (isMailerConfigured()) {
      const mailResult = await sendMail(appMessage);
      emailDispatched = mailResult.delivered;
      emailProvider = mailResult.provider;
      if (mailResult.delivered === false) {
        emailReason = mailResult.reason;
      }
    }

    res.status(201).json({
      success: true,
      application: record,
      routedToEmail: PLATFORM_OWNER_EMAIL,
      emailDispatched,
      emailProvider,
      emailReason,
      firestoreSynced,
      mailtoUrl,
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
      console.warn('[Mentorship] Cloud SQL list applications fallback:', sqlErr?.message || sqlErr);
      sqlApps = null;
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
      console.warn('[CloudSQL] Application decision update fallback:', err?.message || err);
      return null;
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
        email: updated.applicantEmail,
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
            email: updated.applicantEmail,
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

    let emailDispatched = false;
    let emailReason: string | undefined = isMailerConfigured() ? undefined : 'not_configured';
    let mailtoUrl: string | undefined;

    if (updated.applicantEmail && isValidEmailAddress(updated.applicantEmail)) {
      const decisionMsg = buildMentorApplicationDecisionMessage({
        applicantEmail: updated.applicantEmail,
        fullName: updated.fullName,
        decision,
        reviewerNote: updated.reviewerNote,
      });
      mailtoUrl = buildMailtoUrl(updated.applicantEmail, decisionMsg.subject, decisionMsg.text);
      if (isMailerConfigured()) {
        const mailResult = await sendMail(decisionMsg);
        emailDispatched = mailResult.delivered;
        if (mailResult.delivered === false) emailReason = mailResult.reason;
      }
    }

    res.json({
      success: true,
      application: updated,
      mentorProfile: publishedMentorProfile,
      emailDispatched,
      emailReason,
      mailtoUrl,
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

// 5. POST /api/mentorship/requests - Submit mentorship request & email mentor with signed Yes/Decline form
mentorshipRouter.post('/requests', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const {
      mentorId,
      subjectId,
      targetTrack,
      goalDescription,
      initialMessage,
      preferredCadence,
      learnerEmail,
    } = req.body || {};

    if (!mentorId || !subjectId || !goalDescription || !initialMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: mentorId, subjectId, goalDescription, initialMessage',
      });
    }

    const cleanLearnerEmail = typeof learnerEmail === 'string' && learnerEmail.trim()
      ? learnerEmail.trim().toLowerCase()
      : (authReq.user?.email || '').trim().toLowerCase();

    if (!isValidEmailAddress(cleanLearnerEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid contact email address for your mentorship request.',
      });
    }

    const { request, error } = Database.createMentorshipRequest(userId, {
      mentorId,
      subjectId,
      targetTrack,
      goalDescription,
      initialMessage,
      preferredCadence,
      learnerEmail: cleanLearnerEmail,
    });

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const mentor = Database.getMentor(request.mentorId);
    const mentorEmail = (request.mentorEmail || mentor?.email || '').trim().toLowerCase();

    if (adminDb) {
      try {
        await adminDb.collection('mentorship_requests').doc(request.id).set(request);
        if (mentor?.userId) {
          await adminDb.collection('notifications').add({
            userId: mentor.userId,
            type: 'mentorship_request',
            requestId: request.id,
            message: `${request.learnerName} (${cleanLearnerEmail}) requested mentorship in ${String(subjectId).toUpperCase()}.`,
            read: false,
            createdAt: request.createdAt,
          });
        }
      } catch (fbErr) {
        console.warn('[Firestore] Mentorship request mirror skipped:', fbErr);
      }
    }

    let emailDispatched = false;
    let emailProvider: string = 'none';
    let emailReason: string | undefined = isMailerConfigured() ? undefined : 'not_configured';
    let mailtoUrl: string | undefined;

    if (mentorEmail && isValidEmailAddress(mentorEmail)) {
      const origin = getConfiguredAppOrigin();
      const acceptToken = createMentorshipEmailActionToken(request.id, request.mentorId, 'ACCEPT');
      const declineToken = createMentorshipEmailActionToken(request.id, request.mentorId, 'DECLINE');
      const acceptUrl = `${origin}/api/mentorship/requests/${encodeURIComponent(request.id)}/email-respond?token=${encodeURIComponent(acceptToken)}`;
      const declineUrl = `${origin}/api/mentorship/requests/${encodeURIComponent(request.id)}/email-respond?token=${encodeURIComponent(declineToken)}`;

      const requestMail = buildMentorshipRequestMessage({
        mentorEmail,
        mentorName: request.mentorName,
        learnerName: request.learnerName,
        learnerEmail: cleanLearnerEmail,
        subjectId: String(request.subjectId),
        targetTrack: request.targetTrack,
        preferredCadence: request.preferredCadence,
        goalDescription: request.goalDescription,
        initialMessage: request.initialMessage,
        acceptUrl,
        declineUrl,
      });

      mailtoUrl = buildMailtoUrl(mentorEmail, requestMail.subject, requestMail.text);

      if (isMailerConfigured()) {
        const mailRes = await sendMail(requestMail);
        emailDispatched = mailRes.delivered;
        emailProvider = mailRes.provider;
        if (mailRes.delivered === false) emailReason = mailRes.reason;
      }
    } else {
      emailReason = 'mentor_email_missing';
    }

    res.status(201).json({
      success: true,
      request,
      mentorEmail: mentorEmail || null,
      emailDispatched,
      emailProvider,
      emailReason,
      mailtoUrl,
    });
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

// 7. POST /api/mentorship/requests/:id/respond - Mentor clicks Yes (ACCEPT) or DECLINE
mentorshipRouter.post('/requests/:id/respond', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { action, note } = req.body;

    if (action !== 'ACCEPT' && action !== 'DECLINE') {
      return res.status(400).json({ success: false, error: 'Action must be ACCEPT or DECLINE' });
    }

    const result = Database.respondMentorshipRequest(userId, req.params.id, action, note, {
      allowAdminOverride: isPlatformOwnerOrAdmin(authReq),
    });
    if (result.error) {
      return res.status(result.forbidden ? 403 : 400).json({ success: false, error: result.error });
    }

    if (adminDb && result.request) {
      try {
        await adminDb.collection('mentorship_requests').doc(result.request.id).set(result.request, { merge: true });
        if (result.relationship) {
          await adminDb.collection('mentorship_relationships').doc(result.relationship.id).set(result.relationship);
        }
      } catch (fbErr) {
        console.warn('[Firestore] Mentorship decision mirror skipped:', fbErr);
      }
    }

    let emailDispatched = false;
    let emailReason: string | undefined = isMailerConfigured() ? undefined : 'not_configured';
    let mailtoUrl: string | undefined;
    const studentEmail = result.request?.learnerEmail;

    if (result.request && studentEmail && isValidEmailAddress(studentEmail)) {
      const msg = buildMentorshipResponseToStudentMessage({
        studentEmail,
        studentName: result.request.learnerName,
        mentorName: result.request.mentorName,
        mentorEmail: result.request.mentorEmail,
        subjectId: String(result.request.subjectId),
        action,
        note,
      });
      mailtoUrl = buildMailtoUrl(studentEmail, msg.subject, msg.text);
      if (isMailerConfigured()) {
        const mailRes = await sendMail(msg);
        emailDispatched = mailRes.delivered;
        if (mailRes.delivered === false) emailReason = mailRes.reason;
      }
    }

    res.json({
      success: true,
      request: result.request,
      relationship: result.relationship,
      studentEmail: studentEmail || null,
      emailDispatched,
      emailReason,
      mailtoUrl,
    });
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

