# LearnCo — Deep Audit: Fix Report (Track A + Track B)

Branch: `arena/697a3941-learn-co` (from `main@07da94d`)
Commits: `48bb6cf` · `fe2efa9` · `842d5c7`
Scope completed: **security hardening (A)** and **real Creator Studio ingestion (B)**.

---

## 1. Errors identified

### C1 — CRITICAL: broken access control (anyone could read *and write* user data)

Every authenticated API route was effectively public. Unauthenticated requests
fell through a "guest" fallback that silently assumed the caller was a seeded
demo account.

Reproduced on the merged `main` before fixing:

```
GET  /api/user/profile          (no auth) -> 200, leaked yamsaniruhan@gmail.com
PUT  /api/user/profile  {"fullName":"PWNED"} (no auth) -> 200, mutated real data
GET  /api/analytics/dashboard   (no auth) -> 200
```

Four independent backdoors, in four files:

| # | Location | Cause |
|---|---|---|
| 1 | `server/middleware/authMiddleware.ts` | no header, bare `catch`, and `!user` all resolved to a seeded user |
| 2 | `server/routes/analyticsRoutes.ts` | local permissive `requireAuth` defaulted to `token-alex-001` |
| 3 | `middleware/auth.js` | three guest fallbacks in the CommonJS guard |
| 4 | `server/routes/copilotRoutes.ts` | `resolveUserId()` returned `'user-alex-001'` |

Backdoor #4 was **not found by manual reading** — it was caught only when the new
401 regression matrix ran. That is the strongest argument for having tests.

### C2 — CRITICAL: password hashing was effectively unsalted

`createHmac('sha256', 'learnco_salt_2026')` — one global constant salt, fast hash.
Identical passwords produced identical hashes; a stolen DB was cheap to crack.

### C3 — HIGH: zero tests, zero CI

71k LOC, 114 components, and not one automated test. Nothing stopped regressions.

### H4 — HIGH: malformed JSON leaked an HTML stack trace

A bad request body returned a rendered `SyntaxError` page exposing server file paths.

### H5 — HIGH: practice attempts accepted empty payloads

`POST /practice/submit-attempt` with `{}` persisted `questionId: undefined`,
silently poisoning mastery and readiness calculations.

### H6 — HIGH: Creator Studio was partly synthetic (violated the "no mock data" rule)

- PDF uploads: the client threw away the real file and sent the literal string
  `"PDF Document: <name> (Uploaded content buffer)"`. The server replaced it with
  invented prose ("Mathematical formulations, formal definitions…").
- URL imports: the server never fetched the page. It fabricated a summary from
  the hostname and, optionally, the URL string itself.

Every generated artifact was therefore synthesised from text the user never supplied.

### M7 — MEDIUM: failed extractions burned the user's daily quota

Quota incremented *before* extraction. A dead link or unreadable PDF cost a slot
with nothing to show for it. Discovered during URL failure-path testing: six
consecutive bad imports exhausted the quota.

### M8 — MEDIUM: tests wrote into the live database

`DB_FILE_PATH` was hardcoded to `process.cwd()/.learnco_db.json`, so `npm test`
created real users in the developer's working dataset.

### M9 — MEDIUM: build/run asymmetry

`import.meta` produced a bundler warning in the CJS build; `__dirname` produced a
`ReferenceError` in the ESM dev server. The font-path helper had to satisfy both.

---

## 2. Changes made

**Authentication (C1).** Rewrote `requireAuth`/`verifyFirebaseAuth` around one
shared `resolveUserFromToken()` (session store → token cache → Firebase). Missing,
malformed, or unknown tokens now return `401` and never impersonate. Removed all
four guest fallbacks. `optionalAuth` populates `req.user` only on a valid token and
otherwise continues anonymously. Analytics and Copilot routers are now mounted
behind real guards, with `'user-alex-001'` defaults replaced by `req.userId`.

**Passwords (C2).** scrypt with a per-user 16-byte random salt (N=16384, r=8, p=1,
64-byte key), compared with `timingSafeEqual`. Legacy HMAC hashes still verify and
are transparently rehashed on next successful login, so no account is locked out.

**Error handling (H4).** Global JSON error handler after the routes; malformed
bodies now return a clean JSON `400`.

**Validation (H5).** `/submit-attempt` rejects missing or invalid `questionId`,
`subjectId`, `isCorrect` with `400 INVALID_ATTEMPT` naming the offending fields.
The real client already sent all three, so nothing broke.

**Real ingestion (H6).** New `server/services/documentExtraction.ts`:
- `extractPdfText()` — decodes data URI or bare base64, checks `%PDF-` magic bytes,
  extracts the text layer page by page with `pdfjs-dist` (≤300 pages / 200k chars),
  and returns a precise typed error for encrypted, scanned, oversized, corrupted,
  or non-PDF input.
- `extractUrlText()` — server-side fetch with 15s timeout, size cap, and SSRF
  guards: blocks loopback/private/link-local/metadata hosts, non-http(s) schemes,
  and **re-validates the host after redirects**. HTML is reduced to prose
  (drops script/style/nav/footer, keeps headings, paragraphs, list items, decodes
  entities); title preference is `og:title` → `<title>` → `<h1>`.
- `ExtractionError` carries an HTTP status and machine code, so routes answer
  400/413/415/422/502/504 with actionable messages instead of a blanket 500.

`creatorRoutes.ts` now calls both for `/sources` and `/generate`; `fileBase64` is
the upload transport while `content` still works for pasted text.

**Quota correctness (M7).** Added `Database.releaseQuota()`; the slot is refunded
on any extraction failure.

**Client.** `SourceIntakePanel.tsx` keeps the picked file's real bytes via
`readFileAsDataUri` (Firebase Storage is still attempted as a backup, but is no
longer the extraction source). On submit it creates the source, then synthesises
from that source id. Extraction errors surface in a new `role="alert"` block
instead of being swallowed.

**Test isolation (M8).** `LEARNCO_DB_FILE` env override; `vitest.config.ts` points
each run at a throwaway temp file. The live dataset is never touched.

**Serviceability (C3).** 68 tests across 3 files, plus `.github/workflows/ci.yml`
(lint → test → build → boot `dist/server.cjs` → assert `/api/health` and that
anonymous `/api/user/profile` is 401).

---

## 3. Files modified

Added
- `server/services/documentExtraction.ts` — PDF/URL extraction + SSRF guards
- `tests/auth.test.ts` (14) · `tests/api.test.ts` (27) · `tests/extraction.test.ts` (27)
- `vitest.config.ts` · `.github/workflows/ci.yml`

Modified
- `server/middleware/authMiddleware.ts` · `middleware/auth.js`
- `server/routes/analyticsRoutes.ts` · `copilotRoutes.ts` · `authRoutes.ts` · `practiceRoutes.ts` · `creatorRoutes.ts`
- `server/db.ts` (scrypt, `verifyPassword`, `needsPasswordRehash`, `releaseQuota`, DB path override)
- `server.ts` (`createApp()`/`startServer()` split, error handler, copilot guard)
- `src/components/create/SourceIntakePanel.tsx` · `src/services/creatorClient.ts`
- `package.json` / `package-lock.json` (`vitest`, `supertest`, `@types/supertest`, `pdfjs-dist`)

---

## 4. Server startup status — PASS

- `npm run dev` boots clean: `Learn.co Server running on http://0.0.0.0:3000`, zero
  warnings in the terminal after the `__dirname` fix.
- Production: `node dist/server.cjs` boots and serves both API and SPA.
- `GET /` → 200, `GET /api/health` → 200.

## 5. Production build status — PASS

- `tsc --noEmit` → exit 0.
- `npm run lint` → exit 0.
- `npm run build` → exit 0, **0 warnings, 0 errors**.
- Client bundle 3.72 MB (`pdfjs-dist` is server-only and does **not** ship to the browser).

## 6. Functional testing results

| Check | Result |
|---|---|
| Anonymous profile / analytics / copilot / planner / gamification / creator | **401** (was 200) |
| Bogus bearer token | **401** |
| Authenticated profile / analytics / gamification / planner | **200** |
| Real PDF → extracted text verbatim | **201**, `"[Page 1] Quadratic Equations and the Discriminant…"` |
| Same PDF through built CJS bundle | **201**, identical text, no font warnings |
| PNG renamed to `.pdf` | **415** with an actionable message |
| Empty/corrupt PDF payload | **400** |
| SSRF: `127.0.0.1`, `localhost`, `192.168.*`, `169.254.169.254`, `10.*`, `[::1]`, `.internal` | **400**, request never sent |
| `file://` / `ftp://` | **400** |
| Redirect to loopback | **400** |
| 6 consecutive failed URL imports | quota remains **0/5 used** |
| Malformed JSON body | **400** JSON, no stack trace, no `<html>` |
| Empty practice attempt | **400 INVALID_ATTEMPT** |
| Full suite | **68/68 passing** |

Note on live URL fetches: outbound HTTPS from this sandbox fails with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` (TLS interception in the environment, not the
app). URL ingestion is therefore verified by unit tests that stub only the network
boundary — the real fetch, redirect re-validation, and parsing paths are exercised
against real `Response` objects.

## 7. Remaining issues (honest list)

**Not yet fixed — queued, in recommended order**

1. **Learning Studio depth (Track C) — the biggest product gap.** 63 concepts
   across 44 chapters, and exactly **one topic per chapter**. Content asymmetry is
   severe: 4,619 question rows but only **855 unique texts** and 63 concepts, i.e.
   questions are thin duplicates with no concept-level binding. This is the single
   most important thing to fix for the platform to feel worth paying for.
2. **Bundle size (Track D).** 3.72 MB single JS file, **0 `React.lazy`**. Route
   splitting is a mechanical, low-risk win.
3. **Dead code (Track E).** 8 orphaned modules, 5 unmounted legacy routers (`ai`,
   `copilot`, `creator`, `learning`, `mentorship`), 3 unused deps (`node-cron`,
   `nodemailer`, `uuid`).
4. **Persistence.** `fs.writeFileSync` rewrites the entire 41 KB file on every
   mutation — 8 sync full-file writes per mutation. Fine for one user, unsafe with
   concurrency and slow as it grows. The Postgres/Prisma migration remains a
   **separate proposal awaiting your approval** — I have not touched it.
5. **Missing product surface:** password reset, email verification, realtime
   (WebSocket/SSE), concept-level question binding.
6. **Accessibility is thin:** 24 `aria-label`, 14 `alt`, 4 `role` across 114
   components. Not a crash risk, but below a "premium" bar.
7. **Unverified items:** DOCX ingestion is explicitly rejected with a clear message
   (not silently faked), but is not implemented. Browser-level visual testing was
   not possible — no headless browser can be installed here — so I verified via
   live HTTP probes against the running server and the built bundle.

**What I deliberately did not do:** no redesign, no feature removal, no mock data
added, no schema changes, and no architectural migration without your approval.
