import crypto from 'node:crypto';
import type { Request, Response, NextFunction, CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'learnco_auth';
export const CSRF_COOKIE_NAME = 'learnco_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isSecureRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  if (proto === 'https') return true;
  return process.env.NODE_ENV === 'production';
}

export function authCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export function csrfCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: false,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function ensureCsrfCookie(req: Request, res: Response): string {
  const existing = typeof req.cookies?.[CSRF_COOKIE_NAME] === 'string' ? req.cookies[CSRF_COOKIE_NAME].trim() : '';
  if (existing && /^[a-f0-9]{32,128}$/i.test(existing)) {
    return existing;
  }
  const fresh = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, fresh, csrfCookieOptions(req));
  return fresh;
}

export function setAuthSessionCookies(req: Request, res: Response, sessionToken: string): string {
  res.cookie(AUTH_COOKIE_NAME, sessionToken, authCookieOptions(req));
  const csrfToken = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions(req));
  return csrfToken;
}

export function clearAuthSessionCookies(req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
  });
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createCsrfProtection(allowedOrigins: Set<string>) {
  return function csrfProtection(req: Request, res: Response, next: NextFunction) {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
      return next();
    }

    const requestPath = req.originalUrl.split('?')[0] || req.path || '';
    // External webhook & signed HMAC email action endpoints authenticate without cookies.
    if (
      requestPath === '/api/subscription/webhook' ||
      requestPath === '/api/auth/forgot-password' ||
      /^\/api\/mentorship\/requests\/[^/]+\/email-respond$/.test(requestPath)
    ) {
      return next();
    }

    // 1. Cross-site metadata check (modern browsers set Sec-Fetch-Site)
    const secFetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
    if (secFetchSite === 'cross-site') {
      res.status(403).json({
        success: false,
        error: 'Cross-site state-changing request blocked.',
        code: 'CSRF_CROSS_SITE',
      });
      return;
    }

    // 2. Origin allowlist check whenever Origin header is provided
    const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
    if (originHeader) {
      const host = req.get('host');
      const sameOrigin = host ? `${req.protocol}://${host}` : '';
      const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
      const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
      const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';

      const isAllowed =
        originHeader === sameOrigin ||
        (forwardedOrigin && originHeader === forwardedOrigin) ||
        allowedOrigins.has(originHeader);

      if (!isAllowed) {
        res.status(403).json({
          success: false,
          error: 'Origin mismatch on state-changing request.',
          code: 'CSRF_ORIGIN_MISMATCH',
        });
        return;
      }
    }

    // 3. Double-submit cookie check: required whenever a browser session cookie
    //    is present, or whenever a CSRF cookie + header pair is already active.
    const hasAuthCookie = typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string' && req.cookies[AUTH_COOKIE_NAME].trim().length > 0;
    const cookieCsrf = typeof req.cookies?.[CSRF_COOKIE_NAME] === 'string' ? req.cookies[CSRF_COOKIE_NAME].trim() : '';
    const headerCsrf = typeof req.headers[CSRF_HEADER_NAME] === 'string' ? req.headers[CSRF_HEADER_NAME].trim() : '';

    if (hasAuthCookie) {
      if (!cookieCsrf || !headerCsrf || !safeEqual(cookieCsrf, headerCsrf)) {
        res.status(403).json({
          success: false,
          error: 'Invalid or missing CSRF token. Refresh the page and try again.',
          code: 'CSRF_INVALID',
        });
        return;
      }
    } else if (cookieCsrf && headerCsrf && !safeEqual(cookieCsrf, headerCsrf)) {
      res.status(403).json({
        success: false,
        error: 'CSRF token mismatch.',
        code: 'CSRF_INVALID',
      });
      return;
    }

    next();
  };
}
