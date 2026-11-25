// src/client/registerSW.js
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        console.debug('Dev SW registration skipped:', err?.message || err);
      });
  } else if (import.meta.env.PROD) {
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl) {
        console.log('SW registered:', swUrl);
      },
      onRegisterError(err) {
        console.error('SW registration failed:', err);
      },
    });
  }
}
