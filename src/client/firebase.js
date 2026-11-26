// src/client/firebase.js
import { buildApiHeaders, ensureCsrfToken } from '../utils/csrf';

export async function apiCall(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const method = String(options.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    await ensureCsrfToken();
  }

  const headers = {
    ...buildApiHeaders(),
    ...(options.headers || {}),
  };

  return fetch(normalizedEndpoint, {
    credentials: 'include',
    ...options,
    headers,
  });
}

export default { apiCall };
