export const CSRF_COOKIE_NAME = 'learnco_csrf';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie || '';
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${CSRF_COOKIE_NAME}=`)) {
      const value = trimmed.slice(CSRF_COOKIE_NAME.length + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;
  try {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      return (data && typeof data.csrfToken === 'string' ? data.csrfToken : null) || getCsrfToken();
    }
  } catch {
    // Offline or network unavailable
  }
  return null;
}

export function buildApiHeaders(
  extra?: Record<string, string>,
  includeContentType = true
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const csrf = getCsrfToken();
  if (csrf) {
    headers[CSRF_HEADER_NAME] = csrf;
  }
  if (extra) {
    Object.assign(headers, extra);
  }
  return headers;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  if (isMutation && !getCsrfToken()) {
    await ensureCsrfToken();
  }
  const hasBody = init.body !== undefined && !(init.body instanceof FormData);
  const baseHeaders = buildApiHeaders(undefined, hasBody);
  const mergedHeaders = new Headers(baseHeaders);
  if (init.headers) {
    const incoming = new Headers(init.headers);
    incoming.forEach((value, key) => mergedHeaders.set(key, value));
  }
  return fetch(input, {
    credentials: 'include',
    ...init,
    headers: mergedHeaders,
  });
}
