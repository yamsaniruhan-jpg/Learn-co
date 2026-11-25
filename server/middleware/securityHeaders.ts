import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function cspNonceMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
}

export function injectNonceIntoHtml(html: string, nonce: string): string {
  if (!nonce) return html;
  return html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
}

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (_req, res) => {
          const nonce = (res as Response)?.locals?.cspNonce;
          return nonce ? `'nonce-${nonce}'` : "'self'";
        },
        'https://www.gstatic.com',
        'https://apis.google.com',
        'https://accounts.google.com',
      ],
      // Inline styles are kept because KaTeX (dynamic per-glyph positioning in FormattedMathText),
      // Recharts (ResponsiveContainer & Tooltip runtime layout styles), motion/react, and dynamic
      // progress-bar width styles generate runtime style="..." attributes that CSP nonces cannot cover.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com', // Seeded mentor & scholar avatars (seedData.ts, mentorshipSeedData.ts)
        'https://api.dicebear.com', // Generated fallback user avatars (server/db.ts)
        'https://lh3.googleusercontent.com', // Google Sign-In profile photos
      ],
      // Gemini requests are proxied strictly through server /api/* ('self'), so no browser Gemini host is needed.
      connectSrc: [
        "'self'",
        ...(() => {
          const wsOrigins: string[] = [];
          for (const raw of [process.env.APP_URL, process.env.APP_ORIGIN]) {
            if (!raw) continue;
            try {
              const u = new URL(raw);
              if (u.protocol === 'https:') wsOrigins.push(`wss://${u.host}`);
              else if (u.protocol === 'http:') wsOrigins.push(`ws://${u.host}`);
            } catch {
              // ignore invalid URL
            }
          }
          return wsOrigins;
        })(),
        'https://identitytoolkit.googleapis.com', // Firebase Auth
        'https://securetoken.googleapis.com', // Firebase Auth token refresh
        'https://firestore.googleapis.com', // Cloud Firestore
        'wss://firestore.googleapis.com', // Cloud Firestore realtime channel
        'https://firebasestorage.googleapis.com', // Firebase Storage uploads
        'https://accounts.google.com', // Google Sign-In
        'https://apis.google.com', // Google API client
        'https://www.googleapis.com', // Google OAuth / userinfo
        'https://robust-virtue-62t1j.firebaseapp.com', // Firebase Auth domain
        'https://api.zotero.org', // Zotero citation sync
      ],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      frameSrc: [
        "'self'",
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://robust-virtue-62t1j.firebaseapp.com',
      ],
      workerSrc: ["'self'", 'blob:'],
      frameAncestors: [
        "'self'",
        'https://*.google.com',
        'https://*.aistudio.google.com',
        'https://aistudio.google.com',
        'https://*.run.app',
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: false, // Disabled to allow AI Studio preview iframe rendering
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Firebase SDK compatibility
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Required for Firebase Google OAuth signInWithPopup
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export default securityHeaders;
