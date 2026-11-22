// src/client/registerSW.js
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister any stale dev service worker so Vite module requests in the
    // preview iframe are never intercepted or re-fetched in a loop.
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
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
