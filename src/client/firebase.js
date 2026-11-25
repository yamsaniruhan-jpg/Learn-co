// src/client/firebase.js
import { buildApiHeaders } from '../utils/csrf';

export async function apiCall(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

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
