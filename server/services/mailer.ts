/**
 * Outbound email for account flows (password reset).
 *
 * There is no mail provider configured in this project, and silently pretending
 * to send would be worse than not sending at all: the UI would report "check your
 * inbox" while nothing ever arrives. This module therefore has exactly one rule —
 * it only claims success when it actually dispatched something.
 *
 * Configure whichever provider you use via environment variables:
 *
 *   RESEND_API_KEY  + MAIL_FROM   -> Resend HTTP API
 *   SMTP_URL        + MAIL_FROM   -> any SMTP relay (optional, uses nodemailer)
 *
 * With neither set, `isMailerConfigured()` is false and callers fall back to
 * returning the reset link directly (see authRoutes), which is safe for
 * self-hosted/single-operator deployments and clearly signposted in the UI.
 */

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type MailResult =
  | { delivered: true; provider: string; id?: string }
  | { delivered: false; provider: 'none'; reason: string };

const MAIL_FROM = process.env.MAIL_FROM || 'LearnCo <no-reply@learnco.app>';

export function isMailerConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.SMTP_URL);
}

/**
 * Dispatch an email. Never throws: a mail failure must not surface as a 500 to a
 * user who is already locked out of their account.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  // Preferred path: Resend's HTTPS API (no SMTP ports to be blocked).
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('[mailer] Resend rejected the message:', res.status, detail.slice(0, 200));
        return { delivered: false, provider: 'none', reason: `resend_${res.status}` };
      }

      const body: any = await res.json().catch(() => ({}));
      return { delivered: true, provider: 'resend', id: body?.id };
    } catch (err: any) {
      console.error('[mailer] Resend request failed:', err?.message || err);
      return { delivered: false, provider: 'none', reason: 'resend_unreachable' };
    }
  }

  // Secondary path: SMTP via nodemailer, loaded lazily so the dependency is
  // optional and never required at boot.
  if (process.env.SMTP_URL) {
    try {
      // Optional peer dependency. Resolved through a variable specifier so the
      // build does not require `nodemailer` to be installed at all.
      const specifier = 'nodemailer';
      const mod: any = await import(/* @vite-ignore */ specifier).catch(() => null);
      if (!mod) {
        return { delivered: false, provider: 'none', reason: 'nodemailer_not_installed' };
      }
      const transporter = mod.createTransport(process.env.SMTP_URL);
      const info = await transporter.sendMail({
        from: MAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { delivered: true, provider: 'smtp', id: info?.messageId };
    } catch (err: any) {
      console.error('[mailer] SMTP send failed:', err?.message || err);
      return { delivered: false, provider: 'none', reason: 'smtp_failed' };
    }
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
        <a href="${resetUrl}"
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
