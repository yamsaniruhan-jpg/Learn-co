# Learn.co — Security & Authorization Specification

## 1. API Key Security & Secret Protection
- **Zero Client-Side Secret Exposure**: No Gemini API keys, Firebase service account keys, or backend secrets are ever shipped to the browser bundle or exposed in the repository.
- **Server-Side AI Proxying**: All interactions with Google Gemini AI models are strictly brokered through backend proxy routes (`/api/planner/*`, `/api/copilot/*`, `/api/creator/*`).
- **Environment Variable Isolation**: `GEMINI_API_KEY` is injected dynamically at server boot from runtime environment variables (`process.env.GEMINI_API_KEY`).
- **Secret Hygiene**: Real API keys are never checked into version control. Repository documentation and examples only use standard placeholders (e.g. `MY_GEMINI_API_KEY`).

## 2. Authentication & Credential Security
- **Salted Password Hashing**: Passwords submitted during registration or login are hashed on the backend using HMAC-SHA256 with cryptographic salts before storage. Plaintext passwords are never persisted to disk or cloud databases.
- **Cryptographic Session Tokens**: User sessions use cryptographically random hex tokens generated via Node's `crypto.randomBytes(32)`.
- **Token Verification**: Protected API endpoints enforce Bearer token verification via `authMiddleware`, resolving requests strictly to the authenticated `req.userId`.
- **Multi-Tenant Data Isolation**: Users cannot view, modify, or delete another user's study plans, notebook mistakes, creator sources, or private notes.

## 3. Leaderboard Privacy & Identity Protection
- **Privacy Mode Flags**: Users can configure their profile visibility between `public`, `cohort`, or `private` (anonymous) at any time.
- **Leaderboard Masking**: When private mode is activated, a scholar's identity is masked as "Anonymous Scholar" across the 30-tier ranking system while preserving their verified XP and streak.
- **Opt-in Standings**: Users have direct control via Privacy Settings to opt in or out of public cohort standings.

## 4. Educational Compliance & Student Rights
- **Zero Commercial Data Brokering**: Student telemetry, question attempts, diagnostic logs, and focus audio are never sold, rented, or monetized.
- **Data Portability**: Full JSON export of student data is available with one click via Profile & Privacy Settings.
- **FERPA & COPPA Alignment**: Encryption at rest and in transit (TLS 1.3) protects student diagnostic and demographic information.

## 5. Input Validation & Defense in Depth
- **Payload Sanitization**: Text inputs, math formula strings, and document uploads are sanitized against cross-site scripting (XSS) and injection attacks.
- **Concurrency Locks**: Critical state transitions (XP balance, streak updates, test submissions) run inside per-user mutex locks (`withUserLock`) to prevent race conditions.

