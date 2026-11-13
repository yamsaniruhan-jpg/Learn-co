# LearnCo — Deep Audit: Fix Report (Tracks A, B, C)

Branch: `arena/697a3941-learn-co` (from `main@07da94d`)
Commits: `48bb6cf` · `fe2efa9` · `842d5c7` · `0d2d018`
Scope completed: **security (A)**, **real Creator Studio ingestion (B)**,
**curriculum depth (C)**.

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

### C10 — CRITICAL: 100% of the question bank was orphaned

Every one of the **4,600 generated questions** carried a `conceptId` of the form
`concept-<topic>-gen-<n>` that **no concept ever declared**. Verified directly:
only 5 of 4,619 questions pointed at a real concept id. The consequence is that
practice could never route back to theory, and a concept page could never offer
its own practice — the join that makes a learning platform work did not exist.

Cause: `QuestionGeneratorEngine.generateQuestionsForTopic()` was never given the
topic's concepts and synthesised the id itself.

### C11 — CRITICAL: 36 of 63 concepts had no worked examples, pitfalls or mini-check

`ConceptDetailView` hides those tabs when the arrays are empty, so **more than
half the concept library silently lost a third of its learning surface** while
still counting toward curriculum totals. Learners saw a definition, an intuition
and formulas — then nothing to practise or check understanding against.

### C12 — HIGH: the curriculum was one topic deep per chapter

44 chapters, 46 topics, 63 concepts. A chapter like "Differential Calculus"
contained a single narrow topic on monotonicity — no limits, no continuity, no
differentiation rules. Entire foundational sequences were absent: kinematics and
Newton's laws (physics), atomic structure and equilibrium (chemistry), Python
fundamentals (CS), membrane transport and photosynthesis (biology), and limits
before derivatives (math). A chapter could not be studied end to end.

### C13 — MEDIUM: a broken prerequisite reference

`concept-deriv-inc-dec` declared a prerequisite `math-limits-deriv`, which no
concept declared. Prerequisite links silently went nowhere.

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


**Curriculum depth and concept binding (Track C).**

*Question bank joins to the curriculum.* `generateQuestionsForTopic()` now
receives the topic's real concepts and round-robins questions across them, so
every generated row resolves to a concept that exists. A new
`generateQuestionsForConcepts()` derives practice items from each concept's own
mini-check and worked examples — the topic generator produces subject archetypes,
so a learner opening "Epsilon-Delta Definition" was being served a monotonicity
question. `QuestionSelectionEngine` now leads with those concept-exact items when
a session is scoped to one concept. Orphaned questions: **4,600 → 0**.

*Coverage expansion.* 52 new topics across all seven subjects, appended to
existing chapters — nothing removed or reordered. Every single-topic chapter is
now multi-topic (**0 of 44**), following a prerequisite chain rather than an
arbitrary list. Genuinely missing ground was added: limits/continuity,
integration techniques, vector spaces, partial derivatives, random variables,
counting, coordinate geometry, divisibility (math); Python fundamentals,
recursion/DP, ML foundations, backpropagation, processes/threads, replication,
greedy algorithms, HTTP API design (CS); kinematics, Newton's laws, rotation,
oscillations, electrostatics, kinetic theory, sound/Doppler, atomic models,
hydrostatics, gravitational fields (physics); atomic structure, equilibrium,
thermochemistry, acid-base, isomerism, electrolysis, coordination nomenclature,
colligative properties, polymers (chemistry); membrane transport,
photosynthesis, enzyme kinetics, Mendelian genetics, mutation, selection,
homeostasis, trophic energy, gel electrophoresis, plant transport (biology);
context clues, evidence integration, comparative analysis (English); experiment
design, trees/ensembles, drift monitoring (data science).

*Content completeness.* All 36 summary-only concepts now carry a real worked
example with a final answer, at least one genuine pitfall with a counterexample,
and a diagnostic mini-check. Missing sections: **36 → 0**.

*Integrity gate.* New `server/services/curriculumIntegrity.ts` plus
`tests/curriculum.test.ts` (18 tests) validate duplicate/misplaced/incomplete
concepts, dangling prerequisites, empty topics, stale `conceptCount` metadata,
orphaned questions and duplicate question ids. **CI now fails if any of these
regress** — the exact class of silent drift that produced C10 and C11.

**Serviceability (C3).** 89 tests across 4 files, plus `.github/workflows/ci.yml`
(lint → test → build → boot `dist/server.cjs` → assert `/api/health` and that
anonymous `/api/user/profile` is 401).

---

## 3. Files modified

Added
- `server/services/documentExtraction.ts` — PDF/URL extraction + SSRF guards
- `tests/auth.test.ts` (14) · `tests/api.test.ts` (27) · `tests/extraction.test.ts` (27)
- `vitest.config.ts` · `.github/workflows/ci.yml`
- `src/data/curricula/curriculumExpansion.ts` … `curriculumExpansion5.ts` — 52 new topics
- `src/data/curricula/conceptEnrichment.ts` — worked examples / pitfalls / mini-checks for 36 concepts
- `server/services/curriculumIntegrity.ts` — validation gate
- `tests/curriculum.test.ts` (18 tests)

Modified
- `server/middleware/authMiddleware.ts` · `middleware/auth.js`
- `server/routes/analyticsRoutes.ts` · `copilotRoutes.ts` · `authRoutes.ts` · `practiceRoutes.ts` · `creatorRoutes.ts`
- `server/db.ts` (scrypt, `verifyPassword`, `needsPasswordRehash`, `releaseQuota`, DB path override)
- `server.ts` (`createApp()`/`startServer()` split, error handler, copilot guard)
- `server/services/questionGeneratorEngine.ts` (concept binding + concept-specific questions)
- `server/services/questionSelectionEngine.ts` (prioritise concept-exact items)
- `server/data/questionBankData.ts` · `src/data/curriculumData.ts`
- `src/components/create/SourceIntakePanel.tsx` · `src/services/creatorClient.ts`
- `package.json` / `package-lock.json` (`vitest`, `supertest`, `@types/supertest`, `pdfjs-dist`)

Removed (Track E — 35 files, 2,780 lines, all verified unreachable)
- `app.js` — a second, never-loaded Express app
- `routes/{ai,copilot,creator,learning,mentorship}.js` · `controllers/*.js`
- `services/{copilotService,geminiService}.js` · `middleware/{security,validate,aiRateLimit}.js`
- `client/{firebase,registerSW}.js` · `components/` (8 duplicate JSX components)
- `src/components/{GamificationBar,Leaderboard,Marketplace,ProgressDashboard,SafeInput,XPToast,AIUsageIndicator}.jsx`
- `src/components/common/{Breadcrumbs,SafeInput}.tsx` · `src/services/{apiClient,masteryEngine}.ts`
- `public/sw.js` (no `serviceWorker.register` call anywhere)
- 4 runtime deps: `@google/generative-ai`, `node-cron`, `nodemailer`, `uuid` (+3 `@types`)

**Kept on purpose:** `middleware/auth.js`, `routes/{subscription,gamification,marketplace}.js`,
`services/{gamification,marketplace,mentorship,progress}Service.js` — all 8 are
imported by live code and were confirmed working by HTTP probes.

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
- Client bundle 3.97 MB (`pdfjs-dist` is server-only and does **not** ship to the browser; the growth is the expanded curriculum content).

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
| Full suite | **89/89 passing** |
| Live curriculum API (dev + prod bundle) | 7 subjects, 44 chapters, **98 topics**, **132 concepts**, **0 single-topic chapters** |
| New concept pages via `/api/learning/concept/:id` | 200 with worked example + pitfall + mini-check + formulas |
| Generated questions resolving to a real concept | **10,084 / 10,084** (was 19 / 4,619) |
| Concept-scoped practice session | Returns that concept's own questions first |

Note on live URL fetches: outbound HTTPS from this sandbox fails with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` (TLS interception in the environment, not the
app). URL ingestion is therefore verified by unit tests that stub only the network
boundary — the real fetch, redirect re-validation, and parsing paths are exercised
against real `Response` objects.

## 7. Remaining issues (honest list)

**Fixed in Track C, with an honest caveat**

- Curriculum depth and concept binding are done: 63 → 132 concepts, 0 orphaned
  questions, 0 concepts without practice, 0 single-topic chapters.
- **Caveat worth knowing:** the topic-level generator still produces *subject
  archetypes* rather than per-topic problems, so a question inside "Limits &
  Continuity" may be about monotonicity. Concept-scoped practice now leads with
  concept-exact items, but the topic-level pool is still generic. Replacing it
  with genuinely topic-specific problems is real authoring work, not a code fix.
- 265 of the 10,084 questions are currently concept-exact. That is enough to
  cover every concept, but not yet enough for long practice runs per concept.

**Not yet fixed — queued, in recommended order**

1. **Bundle size (Track D).** 3.97 MB single JS file, **0 `React.lazy`**. Route
   splitting is a mechanical, low-risk win.
2. **Dead code (Track E).** DONE — see `## 8. Track E` below. **Correction to an
   earlier claim in this report:** there are **no unmounted routers**. All **14**
   are mounted in `server.ts:124–137`. The earlier "5 unmounted legacy routers" note
   was wrong and is retracted.
3. **Persistence.** `fs.writeFileSync` rewrites the entire 41 KB file on every
   mutation — 8 sync full-file writes per mutation. Fine for one user, unsafe with
   concurrency and slow as it grows. The Postgres/Prisma migration remains a
   **separate proposal awaiting your approval** — I have not touched it.
4. **Missing product surface:** password reset, email verification, realtime
   (WebSocket/SSE). Concept-level question binding is now in place.
5. **Accessibility is thin:** 24 `aria-label`, 14 `alt`, 4 `role` across 114
   components. Not a crash risk, but below a "premium" bar.
6. **Unverified items:** DOCX ingestion is explicitly rejected with a clear message
   (not silently faked), but is not implemented. Browser-level visual testing was
   not possible — no headless browser can be installed here — so I verified via
   live HTTP probes against the running server and the built bundle.

**What I deliberately did not do:** no redesign, no feature removal, no mock data
added, no schema changes, and no architectural migration without your approval.

---

## 8. Track E — dead code removal

### Correction first

An earlier draft of this report claimed **"5 unmounted legacy routers"**. That was
**wrong**. Every router is mounted — there are **14** mounts at `server.ts:124-137`:

```
/api/auth         /api/user         /api/practice     /api/learning
/api/leaderboard  /api/ai           /api/creator      /api/copilot
/api/mentorship   /api/subscription /api/gamification /api/marketplace
/api/planner      /api/analytics
```

Retracted. Nothing was ever unmounted; the legacy routers I originally suspected
are in fact **live** (see below). (An earlier note also said "13" — also wrong;
the count is 14. Both errors are corrected here.)

### The trap I hit (worth recording)

I built a reachability graph from real entry points (`server.ts`, `src/main.tsx`)
and treated unreferenced files as dead. Then I deleted the legacy tree and
`npx tsc --noEmit` immediately failed with six `TS2307 Cannot find module` errors.
**Live code imports the top-level `services/`, `routes/` and `middleware/`.** I
restored everything from `git checkout HEAD -- ...` (tree clean, tsc green) and
rebuilt the graph correctly.

Root cause of the false negative: `tsconfig` uses `moduleResolution: bundler`,
so `'../../services/progressService'` resolves `services/progressService.js` — a
file my first pass had resolved to a *different* candidate. A path-based graph is
only trustworthy if the resolver matches the bundler exactly. The corrected
script resolves `.ts/.tsx/.js/.jsx/.cjs/.json` then `index.*`, and matches full
relative paths without dropping segments.

Lesson applied for the rest of this track: **move files aside, run `tsc`, and only
then delete.** No file was deleted on the strength of the graph alone.

### What the corrected graph found

196 reachable modules. Exactly **8 files** under the legacy top-level dirs are
genuinely live and were kept:

| Kept (live) | Why it must stay |
|---|---|
| `middleware/auth.js` | mounted at `server.ts:22`; the Track A hardening lives here — confirmed intact (`verifyIdToken`, 140 lines, unchanged) |
| `routes/subscription.js` | mounted `server.ts:19`; Stripe tiers/checkout/webhook |
| `routes/gamification.js` | mounted `server.ts:20` |
| `routes/marketplace.js` | mounted `server.ts:21` |
| `services/gamificationService.js` | required by `routes/gamification.js` |
| `services/marketplaceService.js` | required by `routes/marketplace.js` |
| `services/mentorshipService.js` | required by `server/routes/mentorshipRoutes.ts` |
| `services/progressService.js` | required by `server/routes/learningRoutes.ts` |

The other **27 files** (2,780 lines) were confirmed unreachable and removed:

- **Legacy parallel backend:** `app.js` — a complete second Express app
  (`app.js`) that mounted 8 routers and was never loaded by anything.
- **Dead routers:** `routes/{ai,copilot,creator,learning,mentorship}.js`
- **Dead controllers:** `controllers/{aiController,copilotController}.js`
- **Dead services:** `services/{copilotService,geminiService}.js`
- **Dead middleware:** `middleware/{security,validate,aiRateLimit}.js` — shadowed
  by the TypeScript `server/middleware/*` equivalents
- **Dead client helpers:** `client/{firebase,registerSW}.js` (`src/client/registerSW`
  is the live one)
- **8 duplicate components in `components/`** — byte-identical to `src/components/`
  twins apart from a header comment
- **7 superseded `src/components/*.jsx`** — `src/components/Leaderboard.tsx` etc.
  are what the app actually renders
- **4 orphaned `src/` modules:** `services/apiClient.ts` (149 lines),
  `services/masteryEngine.ts` (61), `components/common/Breadcrumbs.tsx`,
  `components/common/SafeInput.tsx`
- **`public/sw.js`** — a service worker nothing registers
  (`serviceWorker.register` appears nowhere in `src/` or `index.html`)

### Dependencies

Verified by grepping **actual imports**, not by reading `package.json`. Four
packages had zero importers and were removed, along with 3 `@types` stubs:

`@google/generative-ai` (only the deleted `services/geminiService.js` used it),
`node-cron`, `nodemailer`, `uuid`, and their `@types/*`.

**One correction during this step:** I also removed `dotenv` and the test suite
broke (`Failed to load url dotenv/config`). `server.ts:1` has
`import "dotenv/config"` — a bare side-effect import my regex did not match.
Restored it. `dotenv` is genuinely required: `server.ts` documents and reads real
env vars (`GEMINI_API_KEY`, `FIREBASE_*, GOOGLE_APPLICATION_CREDENTIALS`,
`LEARNCO_DB_FILE`) and `.env.example` is in the repo.

This is exactly why "unused dependency" claims need an import-level check that
includes side-effect imports.

### Result

| Metric | Before | After |
|---|---|---|
| Files deleted | — | **35** |
| Lines removed | — | **2,780** (net −2,772) |
| Runtime dependencies | 37 | **32** |
| Dead duplicate backends | 2 | **1** |

### Verification after removal

- `npx tsc --noEmit` — clean, exit 0
- `npm test` — **89/89 passing, 4 files**
- `npm run build` — exit 0, **0 warnings**
- `npm run dev` — boots clean, no errors in terminal
- Production runtime probes on the built `dist/server.cjs`: 13 endpoints
  **200 with auth**, and `/api/user/profile`, `/api/gamification/profile`,
  `/api/copilot/conversations` correctly **401 without** a token — proving
  `middleware/auth.js` is still doing its job after the cleanup.
- `middleware/auth.js` verified unmodified (`git status` clean for that path) so
  Track A's hardening survives.

### Honest caveats

- Track E removes dead weight; it does **not** shrink the shipped bundle. The
  bundle is still **3.97 MB** because the dead files were never bundled. The
  size win belongs to Track D (route splitting, 0 `React.lazy` today).
- The legacy `routes/{subscription,gamification,marketplace}.js` and their
  services are still CommonJS in a TypeScript codebase. They work and are used,
  so removing them would be a rewrite — out of scope here. Porting them to
  `server/routes/*.ts` is a sensible future cleanup.
- Reachability is static. It cannot see runtime dynamic `require()`. I
  cross-checked by running `tsc`, tests, a build and live HTTP probes, which
  would catch a missing module — but I make no claim beyond that.
