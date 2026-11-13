# Development server and application stability audit

## Scope and evidence

Audit of branch `arena/eb116c01-learn-co`, based on `630d4c7`. This report records reproduced failures and tested fixes; it is not proof that every page, external integration or long-running deployment is error-free. No architecture or visual redesign was attempted. Existing user data was not intentionally replaced; tests and server probes use an isolated `LEARNCO_DB_FILE`.

## 1. Root causes and contributing factors

- The earlier pre-warm logs provided by the user explicitly reported `ERR_MODULE_NOT_FOUND` for `pdfjs-dist`. In this checkout the package was missing from `package.json`, while code imported it at server startup. The exact state of the earlier hosted installation is not available for inspection.
- `package.json`, `package-lock.json` and `bun.lock` were inconsistent. A clean `npm ci` failed with `EUSAGE`; the test script and required test packages were also absent. This prevented reliable installs and CI. The Bun lockfile also described a different manifest. They are synchronized now.
- The current code and its regression suite had drifted apart. Initial type-checking failed and the first runnable test suite had 25 failures: the reset endpoints and mobile grouping had disappeared, XP levels diverged, and several test contracts reflected older implementations.
- The database ignored `LEARNCO_DB_FILE`, so tests wrote into the checked-in local JSON database; its loader restored only part of the persisted data. The initially clean database file was restored after the first test run, before continuing with an isolated file.
- App initialization called `.length` on unvalidated parsed browser storage. Corrupt JSON or a `null` value could crash initialization. This was identified by code inspection and covered with regression tests, not reproduced in a real browser.
- Global exception handlers registered during each app creation could hide fatal startup or programming failures instead of reporting an actionable exit. Startup is now explicitly caught and optional Firestore background work has local rejection handling.

## 2. Fixes implemented

- Restored the PDF dependency and test dependencies/scripts. Updated PDF.js to 6.5.438 for the reported PDF.js advisory and changed extraction to destroy the loading task using the current API. Updated Vitest to 4.1.12 to address the test-runner advisories; refreshed both lockfiles.
- Restored password-reset endpoints and their hashed, expiring, single-use token records. Reset links use the configured application origin rather than an untrusted request header; reset tokens are redacted from API request-path logs. Reset links are passed into the existing authentication UI.
- Rejected fabricated Google tokens on the server and restored an actual Firebase popup in the existing dialog. The server verifies Firebase tokens and requires a verified Google identity. Google sign-in returns an explicit unavailable error if Firebase Admin is not configured.
- Preserved compatibility with both previously used `scrypt$...` and current `scrypt:...` hashes, as well as legacy HMAC verification.
- Restored category grouping for the mobile drawer without discarding the current role-based feature filter or added destinations. Updated tests to use the actual current auth provider and current API contracts.
- Added defensive parsing of app-level local-storage arrays. Added input-type checks and quota refunds for unsuccessful Creator source intake.
- Restored database-file configuration, additional persisted state loading, Creator source persistence, logout persistence and shutdown flushing. Stopped leaderboard reads from promoting users or writing levels; derived levels consistently from XP. Reset the daily URL counter with other daily counters.
- Normalized the legacy router's unauthenticated response shape and documented reset-mail and data-file configuration in `.env.example`.

## 3. Dependency and configuration verification

- `npm ci` succeeded on Node 22.22.3 after lockfile repair; `npm ls --depth=0` succeeded.
- A separate fresh checkout with Bun 1.4.4 passed `bun install --frozen-lockfile`, resolved PDF.js 6.5.438, started the dev server and passed 38 focused tests.
- `npm audit` now reports **4 high, 0 critical** advisories, all in the Firebase / Firestore / `@grpc/grpc-js` dependency chain. The affected Firestore package pins an older gRPC version. It was not force-overridden or downgraded without a live Firestore integration test.
- Several installed Firebase subpackages declare **Node >=24.12.0** while the sandbox and the reported AI Studio logs use Node 22. The application started in both tested package-manager installations, but that is an unsupported engine combination; use a compatible Node runtime or validate an upstream-supported dependency set before relying on it in production.

## 4. Verification performed

- `npm run lint`: passed.
- `npm test`: **163 passed in 15 files**. This includes password hashing and reset, session revocation, mocked Google token verification, creator error and quota handling, corrupt storage, source/XP/session persistence across process restarts, authentication/API protection, curriculum, navigation grouping and PDF extraction.
- `npm run build`: passed. The frontend entry is about 1.57 MB before gzip; this is a performance concern, not a failed build. esbuild also prints its size marker for the 1.2 MB server bundle.
- Dev server: started with the hosting platform's `--port` / `--host` style arguments, remained running during the test/build checks, and returned 200 for the root, health, readiness and transformed entry files. An unauthenticated profile request returned 401. This is a short smoke/soak check, not continuous-production proof.
- Production server: started from the compiled build and returned 200 for the root and health/readiness endpoints. An isolated HTTP smoke run exercised sign-up, protected profile and settings, analytics, curriculum, leaderboard, planner, Creator text intake and invalid-PDF handling, reset request, and unknown-API 404. A separate production restart retained a test user, Creator source and XP history.
- Tests verify reset links use a configured origin and request logs redact reset tokens. With no mail provider, reset links are still logged for the server operator, as explicitly indicated to users.

## 5. Remaining issues and limits

1. **Browser coverage is incomplete.** A headless Chromium attempt could not start because this sandbox lacks `libnspr4.so` and `libnss3.so`. No browser console, responsive layout, real button/form interaction, visual regression or every-page check was completed. HTTP and server-render tests are not a substitute.
2. **Real external integrations are unverified.** Firebase Admin/Firestore credentials, Google OAuth, SMTP/Resend, Gemini and Stripe credentials or services were not available for end-to-end checks. Real Google login now requires valid Firebase Admin credentials, a configured Google provider and allowed auth domains. Mail delivery requires the settings documented in `.env.example`.
3. **Four high dependency advisories and the Firebase/Node engine mismatch remain**, as described above. No unsupported gRPC override was applied.
4. The local JSON store still rewrites a shared file and is not a transactional multi-instance database. The changes improve restart persistence but do not make concurrent deployments durable or prove crash recovery after forced termination.
5. The test and preview results apply to this branch and sandbox. The hosted application still needs the updated files, a fresh dependency installation and deployment; no hosted deployment was performed here.
6. A long-duration soak and real browser-based end-to-end pass remain necessary before claiming continuous stability or complete application coverage.
