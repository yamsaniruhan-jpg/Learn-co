// src/client/firebase.js

export async function apiCall(endpoint, options = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('learnco_auth_token') : null;

  const normalizedEndpoint = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(normalizedEndpoint, {
    ...options,
    headers,
  });
}

export default { apiCall };
