// middleware/security.js
const helmet = require('helmet');

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",    // Firebase SDK needs this
        "'unsafe-inline'",
        "https://www.gstatic.com",   // Firebase
        "https://apis.google.com"    // Google Auth
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: [
        "'self'",
        "https://generativelanguage.googleapis.com",  // Google AI Studio
        "https://firestore.googleapis.com",            // Firestore
        "https://identitytoolkit.googleapis.com",      // Firebase Auth
        "https://securetoken.googleapis.com",          // Firebase token refresh
        "https://www.googleapis.com",                  // Google APIs
        "wss://firestore.googleapis.com",              // Firestore real-time
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "ws:",
        "wss:"
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Firebase SDK compatibility
});

module.exports = securityMiddleware;
