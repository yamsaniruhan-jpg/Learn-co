/**
 * Client-Side Gmail Service
 * 
 * In-memory caching for Google OAuth access tokens and Gmail REST API interaction.
 * Uses client-side token authentication per workspace integration guidelines.
 */

let cachedAccessToken: string | null = null;

export const setCachedGoogleAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const getCachedGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export interface SendGmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email directly via the official Gmail REST API using the user's authorized token.
 */
export async function sendGmailMessage(payload: SendGmailPayload): Promise<GmailSendResult> {
  const token = getCachedGoogleAccessToken();
  if (!token) {
    return {
      success: false,
      error: 'Gmail access token not available. Please sign in with Google to grant email sending permission.',
    };
  }

  try {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;
    const messageParts = [
      `To: ${payload.to.trim()}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      payload.html || payload.text.replace(/\n/g, '<br/>'),
    ];

    if (payload.replyTo) {
      messageParts.splice(1, 0, `Reply-To: ${payload.replyTo.trim()}`);
    }

    const rawMessage = messageParts.join('\r\n');
    const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData?.error?.message || `Gmail send failed with status ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send message via Gmail API.',
    };
  }
}
