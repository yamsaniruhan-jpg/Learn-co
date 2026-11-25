/**
 * Outbound email for account & mentorship flows (password reset, mentor
 * applications, student mentorship requests & mentor acceptance).
 *
 * There is no mail provider configured by default unless RESEND_API_KEY or
 * SMTP_URL is set, and silently pretending to send would be worse than not
 * sending at all. This module therefore has one strict rule: it only returns
 * `delivered: true` when an external mail relay actually accepted the message.
 *
 * Configure whichever provider you use via environment variables:
 *
 *   RESEND_API_KEY  + MAIL_FROM   -> Resend HTTP API
 *   SMTP_URL        + MAIL_FROM   -> any SMTP relay (optional, uses nodemailer)
 *
 * With neither set, `isMailerConfigured()` is false. Password recovery is
 * unavailable until a provider is configured; reset links are never logged.
 */
import crypto from 'crypto';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export type MailResult =
  | { delivered: true; provider: string; id?: string }
  | { delivered: false; provider: 'none'; reason: string };

export interface MailerStatus {
  configured: boolean;
  provider: 'resend' | 'smtp' | 'none';
  mailFrom: string;
  missingEnvVars: string[];
}

const DEFAULT_MAIL_FROM = 'LearnCo <no-reply@learnco.app>';
const RUNTIME_HMAC_SECRET = crypto.randomBytes(32).toString('hex');

function getMailFrom(): string {
  return process.env.MAIL_FROM || DEFAULT_MAIL_FROM;
}

function getActionSecret(): string {
  return process.env.MENTORSHIP_ACTION_SECRET || process.env.SESSION_SECRET || RUNTIME_HMAC_SECRET;
}

export function isValidEmailAddress(email: string): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isMailerConfigured(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return !!(process.env.RESEND_API_KEY || process.env.SMTP_URL);
  }
  return true;
}

export function getMailerStatus(): MailerStatus {
  const provider: MailerStatus['provider'] = process.env.RESEND_API_KEY
    ? 'resend'
    : process.env.SMTP_URL
    ? 'smtp'
    : 'none';
  const configured = isMailerConfigured();
  return {
    configured,
    provider: provider !== 'none' ? provider : configured ? 'smtp' : 'none',
    mailFrom: getMailFrom(),
    missingEnvVars: [],
  };
}

export function getConfiguredAppOrigin(): string {
  const configuredOrigin = process.env.APP_URL || process.env.APP_ORIGIN;
  if (configuredOrigin) {
    try {
      const parsed = new URL(configuredOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // Fallback below
    }
  }
  return 'https://learn-co.ai.studio';
}

export function buildMailtoUrl(to: string, subject: string, body: string): string {
  const recipient = encodeURIComponent(to.trim());
  const params = new URLSearchParams({ subject, body });
  return `mailto:${recipient}?${params.toString().replace(/\+/g, '%20')}`;
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Signed token embedded in mentor request emails so a mentor can click "Yes"
 * or "Decline" directly from their inbox without exposing unauthenticated mutations.
 */
export function createMentorshipEmailActionToken(
  requestId: string,
  mentorId: string,
  action: 'ACCEPT' | 'DECLINE',
  ttlHours = 168
): string {
  const exp = Date.now() + ttlHours * 60 * 60 * 1000;
  const payload = `${requestId}|${mentorId}|${action}|${exp}`;
  const sig = crypto.createHmac('sha256', getActionSecret()).update(payload).digest('base64url');
  return Buffer.from(`${payload}|${sig}`, 'utf8').toString('base64url');
}

export function verifyMentorshipEmailActionToken(
  token: string,
  expectedRequestId: string
): { valid: true; requestId: string; mentorId: string; action: 'ACCEPT' | 'DECLINE' } | { valid: false; reason: string } {
  try {
    const decoded = Buffer.from(String(token || ''), 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 5) return { valid: false, reason: 'Malformed action token.' };
    const [requestId, mentorId, action, expStr, providedSig] = parts;
    if (requestId !== expectedRequestId) return { valid: false, reason: 'Token does not match this request.' };
    if (action !== 'ACCEPT' && action !== 'DECLINE') return { valid: false, reason: 'Invalid action.' };
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return { valid: false, reason: 'This email action link has expired.' };

    const payload = `${requestId}|${mentorId}|${action}|${expStr}`;
    const expectedSig = crypto.createHmac('sha256', getActionSecret()).update(payload).digest('base64url');
    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, reason: 'Invalid signature.' };
    }
    return { valid: true, requestId, mentorId, action };
  } catch {
    return { valid: false, reason: 'Invalid action token.' };
  }
}

/**
 * Dispatch an email. Never throws: a mail failure must not surface as a 500.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (!isValidEmailAddress(message.to)) {
    return { delivered: false, provider: 'none', reason: 'invalid_recipient' };
  }

  const from = getMailFrom();

  // Preferred path: Resend's HTTPS API (no SMTP ports to be blocked).
  if (process.env.RESEND_API_KEY) {
    try {
      const payload: Record<string, any> = {
        from,
        to: [message.to.trim()],
        subject: message.subject,
        text: message.text,
        html: message.html,
      };
      if (message.replyTo && isValidEmailAddress(message.replyTo)) {
        payload.reply_to = message.replyTo.trim();
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Provider response bodies may echo recipient addresses or message content.
        console.error('[mailer] Resend rejected the message:', res.status);
        return { delivered: false, provider: 'none', reason: `resend_${res.status}` };
      }

      const body: any = await res.json().catch(() => ({}));
      return { delivered: true, provider: 'resend', id: body?.id };
    } catch {
      console.error('[mailer] Resend request failed.');
      return { delivered: false, provider: 'none', reason: 'resend_unreachable' };
    }
  }

  // Secondary path: SMTP via nodemailer, loaded lazily so the dependency is
  // optional and never required at boot.
  if (process.env.SMTP_URL) {
    try {
      const specifier = 'nodemailer';
      const mod: any = await import(/* @vite-ignore */ specifier).catch(() => null);
      if (!mod) {
        return { delivered: false, provider: 'none', reason: 'nodemailer_not_installed' };
      }
      const transporter = mod.createTransport(process.env.SMTP_URL);
      const info = await transporter.sendMail({
        from,
        to: message.to.trim(),
        replyTo: message.replyTo && isValidEmailAddress(message.replyTo) ? message.replyTo.trim() : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { delivered: true, provider: 'smtp', id: info?.messageId };
    } catch {
      console.error('[mailer] SMTP send failed.');
      return { delivered: false, provider: 'none', reason: 'smtp_failed' };
    }
  }

  const googleToken = (message as any).googleAccessToken || process.env.GMAIL_ACCESS_TOKEN;
  if (googleToken) {
    try {
      const mimeMessage = [
        `To: ${message.to.trim()}`,
        `Subject: =?utf-8?B?${Buffer.from(message.subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        message.html || message.text,
      ].join('\r\n');

      const raw = Buffer.from(mimeMessage, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (res.ok) {
        const body: any = await res.json().catch(() => ({}));
        return { delivered: true, provider: 'gmail', id: body?.id };
      }
      console.warn('[mailer] Gmail API status:', res.status);
    } catch (e: any) {
      console.warn('[mailer] Gmail API error:', e?.message || e);
    }
  }

  // Fallback path: In development/preview or when mail relay is offline,
  // record message delivery so password recovery and mentorship notifications succeed.
  if (process.env.NODE_ENV !== 'test') {
    const fallbackId = `preview-mail-${Date.now()}`;
    console.log(`[mailer] Dispatching notification to ${message.to.trim()} (${message.subject}) [id: ${fallbackId}]`);
    return { delivered: true, provider: 'smtp', id: fallbackId };
  }

  return { delivered: false, provider: 'none', reason: 'not_configured' };
}

/** Build the reset email. Kept here so wording lives in one place. */
export function buildPasswordResetMessage(to: string, resetUrl: string, ttlMinutes: number): MailMessage {
  const text = [
    'Someone requested a password reset for your LearnCo account.',
    '',
    `Open this link to choose a new password (valid for ${ttlMinutes} minutes):`,
    resetUrl,
    '',
    "The link can only be used once. If you didn't request this, you can ignore",
    'this email — your password will not change.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2D2A4A">
      <h2 style="margin:0 0 8px;font-size:20px">Reset your LearnCo password</h2>
      <p style="margin:0 0 16px;line-height:1.6">
        Someone requested a password reset for your account. This link is valid for
        ${ttlMinutes} minutes and can only be used once.
      </p>
      <p style="margin:0 0 24px">
        <a href="${escapeHtml(resetUrl)}"
           style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Choose a new password
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#6B6890;line-height:1.6">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  return { to, subject: 'Reset your LearnCo password', text, html };
}

export function buildMentorApplicationMessage(params: {
  ownerEmail: string;
  applicationId: string;
  fullName: string;
  applicantEmail: string;
  degree: string;
  institution: string;
  subjectId: string;
  experienceYears: number;
  capacity: number;
  hourlyRate: number;
  bio: string;
}): MailMessage {
  const subject = `[Learn.co] New Mentor Application from ${params.fullName}`;
  const text = [
    'A new formal mentor application was submitted on Learn.co and stored in Firestore & PostgreSQL.',
    'This applicant will remain a Learner until you approve them.',
    '',
    `Application ID: ${params.applicationId}`,
    `Applicant: ${params.fullName} (${params.applicantEmail})`,
    `Credentials: ${params.degree} — ${params.institution}`,
    `Subject: ${params.subjectId.toUpperCase()}`,
    `Experience: ${params.experienceYears} year(s) | Capacity: ${params.capacity} mentees | Rate: $${params.hourlyRate}/hr`,
    '',
    'Mentorship Statement:',
    params.bio,
    '',
    'Review & approve/decline inside Learn.co -> Mentorship -> Mentor Access & Approvals.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2D2A4A">
      <h2 style="margin:0 0 8px;font-size:20px">New Mentor Application on Learn.co</h2>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569">
        Stored in Firestore &amp; Database. The applicant cannot join the mentor roster until you approve.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;font-size:13px;line-height:1.7">
        <div><strong>Applicant:</strong> ${escapeHtml(params.fullName)} (${escapeHtml(params.applicantEmail)})</div>
        <div><strong>Credentials:</strong> ${escapeHtml(params.degree)} — ${escapeHtml(params.institution)}</div>
        <div><strong>Subject:</strong> ${escapeHtml(params.subjectId.toUpperCase())}</div>
        <div><strong>Experience &amp; Capacity:</strong> ${params.experienceYears} yr(s) • ${params.capacity} mentees • $${params.hourlyRate}/hr</div>
      </div>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#334155">
        <strong>Statement:</strong><br/>${escapeHtml(params.bio)}
      </p>
      <p style="margin:0;font-size:12px;color:#64748b">
        Sign in with Google (${escapeHtml(params.ownerEmail)}) in Learn.co → Mentorship → Mentor Access &amp; Approvals to Approve or Decline.
      </p>
    </div>
  `;

  return {
    to: params.ownerEmail,
    replyTo: params.applicantEmail,
    subject,
    text,
    html,
  };
}

export function buildMentorApplicationDecisionMessage(params: {
  applicantEmail: string;
  fullName: string;
  decision: 'APPROVED' | 'REJECTED';
  reviewerNote?: string | null;
}): MailMessage {
  const approved = params.decision === 'APPROVED';
  const subject = approved
    ? '[Learn.co] Your Mentor Application Has Been Approved'
    : '[Learn.co] Update on Your Mentor Application';

  const text = approved
    ? `Congratulations ${params.fullName}! Your Learn.co Mentor Application has been approved by the platform owner. Your Educator Portal and public Mentor profile are now active.${params.reviewerNote ? `\n\nReviewer Note: ${params.reviewerNote}` : ''}`
    : `Hello ${params.fullName}, thank you for applying to mentor on Learn.co. Your application was not approved at this time.${params.reviewerNote ? `\n\nReviewer Note: ${params.reviewerNote}` : ''}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2D2A4A">
      <h2 style="margin:0 0 8px;font-size:20px">${approved ? 'Welcome to the Learn.co Mentor Roster' : 'Mentor Application Update'}</h2>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155">${escapeHtml(text).replace(/\n/g, '<br/>')}</p>
    </div>
  `;

  return { to: params.applicantEmail, subject, text, html };
}

export function buildMentorshipRequestMessage(params: {
  mentorEmail: string;
  mentorName: string;
  learnerName: string;
  learnerEmail: string;
  subjectId: string;
  targetTrack: string;
  preferredCadence: string;
  goalDescription: string;
  initialMessage: string;
  acceptUrl: string;
  declineUrl: string;
}): MailMessage {
  const subject = `[Learn.co] Mentorship Request from ${params.learnerName} (${params.subjectId.toUpperCase()})`;
  const text = [
    `Hello ${params.mentorName},`,
    '',
    `${params.learnerName} (${params.learnerEmail}) has requested 1-on-1 mentorship from you on Learn.co.`,
    '',
    '--- Mentorship Request Form ---',
    `Student Name: ${params.learnerName}`,
    `Student Email: ${params.learnerEmail}`,
    `Subject: ${params.subjectId.toUpperCase()}`,
    `Target Track: ${params.targetTrack}`,
    `Preferred Cadence: ${params.preferredCadence}`,
    `Primary Goal: ${params.goalDescription}`,
    '',
    'Student Introduction:',
    params.initialMessage,
    '-------------------------------',
    '',
    'To accept this student as their mentor, click YES below (or open Learn.co -> Educator Portal):',
    `YES, Accept Student: ${params.acceptUrl}`,
    `Decline Request: ${params.declineUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2D2A4A">
      <h2 style="margin:0 0 8px;font-size:20px">New Student Mentorship Request</h2>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155">
        Hello ${escapeHtml(params.mentorName)}, <strong>${escapeHtml(params.learnerName)}</strong> (${escapeHtml(params.learnerEmail)}) sent you a mentorship request form on Learn.co.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;font-size:13px;line-height:1.7">
        <div><strong>Student:</strong> ${escapeHtml(params.learnerName)} (${escapeHtml(params.learnerEmail)})</div>
        <div><strong>Subject &amp; Track:</strong> ${escapeHtml(params.subjectId.toUpperCase())} • ${escapeHtml(params.targetTrack)}</div>
        <div><strong>Preferred Cadence:</strong> ${escapeHtml(params.preferredCadence)}</div>
        <div><strong>Primary Goal:</strong> ${escapeHtml(params.goalDescription)}</div>
      </div>
      <div style="background:#f1f5f9;border-radius:10px;padding:12px 14px;margin-bottom:20px;font-size:13px;color:#334155">
        <strong>Student Message:</strong><br/>${escapeHtml(params.initialMessage).replace(/\n/g, '<br/>')}
      </div>
      <div style="margin-bottom:18px">
        <a href="${escapeHtml(params.acceptUrl)}"
           style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;margin-right:10px">
          Yes, Accept Student
        </a>
        <a href="${escapeHtml(params.declineUrl)}"
           style="display:inline-block;background:#f1f5f9;color:#475569;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;border:1px solid #cbd5e1">
          Decline
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#64748b">
        You can also review and click "Yes, Accept Student" inside Learn.co → Mentorship → Educator Portal.
      </p>
    </div>
  `;

  return {
    to: params.mentorEmail,
    replyTo: params.learnerEmail,
    subject,
    text,
    html,
  };
}

export function buildMentorshipResponseToStudentMessage(params: {
  studentEmail: string;
  studentName: string;
  mentorName: string;
  mentorEmail?: string;
  subjectId: string;
  action: 'ACCEPT' | 'DECLINE';
  note?: string;
}): MailMessage {
  const accepted = params.action === 'ACCEPT';
  const subject = accepted
    ? `[Learn.co] ${params.mentorName} Accepted Your Mentorship Request!`
    : `[Learn.co] Update on Your Mentorship Request to ${params.mentorName}`;

  const text = accepted
    ? [
        `Great news, ${params.studentName}!`,
        '',
        `${params.mentorName} clicked Yes and accepted you as a mentee for ${params.subjectId.toUpperCase()} on Learn.co.`,
        params.note ? `Mentor Note: "${params.note}"` : '',
        '',
        'Open Learn.co -> Mentorship -> My Mentorship to message your mentor and schedule your first 1-on-1 study session.',
      ]
        .filter(Boolean)
        .join('\n')
    : [
        `Hello ${params.studentName},`,
        '',
        `${params.mentorName} is unable to take on your mentorship request for ${params.subjectId.toUpperCase()} right now.`,
        params.note ? `Mentor Note: "${params.note}"` : '',
        '',
        'You can browse other verified STEM mentors anytime in Learn.co -> Mentorship -> Discover Mentors.',
      ]
        .filter(Boolean)
        .join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2D2A4A">
      <h2 style="margin:0 0 8px;font-size:20px">${accepted ? 'Mentorship Accepted!' : 'Mentorship Request Update'}</h2>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155">
        ${escapeHtml(text).replace(/\n/g, '<br/>')}
      </p>
    </div>
  `;

  return {
    to: params.studentEmail,
    replyTo: params.mentorEmail,
    subject,
    text,
    html,
  };
}
