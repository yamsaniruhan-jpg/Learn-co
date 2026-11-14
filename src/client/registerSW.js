// src/client/registerSW.js
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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

