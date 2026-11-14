import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://www.gstatic.com",
        "https://apis.google.com",
        "https://accounts.google.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://generativelanguage.googleapis.com",
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://accounts.google.com",
        "https://www.gstatic.com",
        "https://robust-virtue-62t1j.firebaseapp.com",
        "https://*.firebaseapp.com",
        "wss://firestore.googleapis.com",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "ws:",
        "wss:",
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://robust-virtue-62t1j.firebaseapp.com",
        "https://*.firebaseapp.com",
      ],
      workerSrc: ["'self'", "blob:"],
      frameAncestors: [
        "'self'",
        "https://*.google.com",
        "https://*.aistudio.google.com",
        "https://aistudio.google.com",
        "https://*.run.app",
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
