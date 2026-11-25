import crypto from 'crypto';

/**
 * Sessions are stored under a SHA-256 hash of the bearer token, never the raw
 * token. Anyone who obtains the data file (or SQL table) therefore cannot
 * replay a session. The "h:" prefix also lets us discard legacy raw-token keys.
 */
export const SESSION_KEY_PREFIX = 'h:';

export function sessionKey(token: string): string {
  return SESSION_KEY_PREFIX + crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function isSessionKey(key: string): boolean {
  return key.startsWith(SESSION_KEY_PREFIX);
}
