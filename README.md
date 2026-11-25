# Learn.co — STEM Learning & Exam Preparation Platform

**Live Site:** [https://learn-co.ai.studio/](https://learn-co.ai.studio/)

Learn.co is an integrated STEM learning workspace covering JEE Mains & Advanced, AP Calculus, IPhO, IChO, IBO, NSEJS, Python/ICT, and AI/ML foundations—combining structured subject curricula, diagnostic practice, an Socratic AI doubt solver (Omni Copilot), study planning, focus sessions, mentorship, and peer study rooms.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React, KaTeX, `react-markdown`, `canvas-confetti`
- **Lazy-Loaded Modules:** Three.js (3D Calculus & Physics visualizations), Recharts (analytics charts), per-subject curriculum chunks, `pdfjs-dist` (Creator Studio PDF ingestion)
- **PWA:** `vite-plugin-pwa` (Workbox shell precaching with runtime caching for subject APIs and lazy chunks)
- **Backend:** Node.js (`>= 24.12.0`), Express (`server.ts`), WebSockets (`ws`) for real-time study rooms
- **Database:** Cloud SQL (PostgreSQL) managed with Drizzle ORM (`src/db/schema.ts`, `pg`), with an optional local-dev JSON fallback (`LEARNCO_JSON_FALLBACK=true`)
- **AI Integration:** `@google/genai` (server-side only via `CopilotGateway` using `gemini-2.5-flash`, `gemini-2.5-pro`, and fallback models with a 20s timeout and RAG grounding)
- **Auth & Security:**
  - Server-issued `HttpOnly`, `SameSite=Lax`, `Secure` session cookies storing SHA-256 token digests (`auth_sessions`)
  - Optional Firebase Authentication (Google Sign-In) & Firebase Admin token verification
  - Per-response cryptographic CSP nonces (`helmet`), zero `'unsafe-inline'`/`'unsafe-eval'` in `script-src`
  - CSRF double-submit token enforcement (`X-CSRF-Token`) on state-changing routes
  - AST/regex-hardened zero-`eval` JavaScript sandbox (`src/utils/safeJsRunner.ts`) for ICT coding problems

---

## Prerequisites & Local Setup

1. **Node.js 24.12+** (see `.nvmrc`) and npm.
2. **Install dependencies:**
   ```bash
   npm ci
   ```
3. **Configure environment variables:**
   Copy `.env.example` to `.env` and populate values as needed:
   - `GEMINI_API_KEY` — Server-side Google GenAI key for Omni Copilot & study tools (if unset, AI routes return a friendly fallback with matching practice questions).
   - `APP_URL` — Public origin URL (e.g. `http://localhost:3000` locally or `https://learn-co.ai.studio`).
   - `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME` — Cloud SQL / PostgreSQL credentials.
   - `LEARNCO_JSON_FALLBACK="true"` and optional `LEARNCO_DB_FILE` — Local-dev JSON fallback when Cloud SQL is not connected.
   - Optional integrations: Firebase Admin (`GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_PROJECT_ID`), Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs), email (`RESEND_API_KEY` or `SMTP_URL`).
4. **Initialize PostgreSQL / Cloud SQL schema:**
   ```bash
   npx drizzle-kit push
   ```
5. **(Optional) One-time migration from legacy `.learnco_db.json`:**
   ```bash
   npx tsx scripts/migrateJsonToDb.ts ./.learnco_db.json
   ```
   Migrates users, profiles, gamification stats, settings, active SHA-256-hashed sessions (skipping legacy raw sessions), practice attempts, mistakes, XP ledger, and mentorship records inside a single transaction.
6. **Run the development server:**
   ```bash
   npm run dev
   ```
   Starts the unified Express + Vite dev server on `http://0.0.0.0:3000` (includes `/health`).

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Express + Vite development server on port `3000` |
| `npm run lint` | Run TypeScript typechecking (`tsc --noEmit`) |
| `npm test` | Run the Vitest test suite (`npx vitest run`) |
| `npm run build` | Build Vite client (`dist/`) and bundle server (`dist/server.cjs`) |
| `npm start` | Start production server (`scripts/start.cjs`) |

---

## Database Backups (Cloud SQL)

Cloud SQL (PostgreSQL) is the source of truth in production. Recommended backup workflow:

1. **Automated daily backups** enabled on the Cloud SQL instance (`--backup-start-time`) with point-in-time recovery (PITR) binary logging.
2. **On-demand snapshot before schema changes or releases:**
   ```bash
   gcloud sql backups create --instance=<YOUR_INSTANCE_ID> --description="Pre-release backup"
   ```
3. **Logical SQL export to Cloud Storage or local archive:**
   ```bash
   gcloud sql export sql <YOUR_INSTANCE_ID> gs://<YOUR_BACKUP_BUCKET>/learnco-$(date +%F).sql --database=$SQL_DB_NAME
   ```
   Or via Cloud SQL Auth Proxy using `pg_dump`:
   ```bash
   pg_dump -h "$SQL_HOST" -U "$SQL_USER" -d "$SQL_DB_NAME" -F c -f "learnco-backup-$(date +%F).dump"
   ```
