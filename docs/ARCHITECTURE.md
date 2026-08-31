# Learn.co — System Architecture

## System Overview
Learn.co is structured around four persistent core tabs:
1. **Creator Studio** (Volume 4): AI synthesis lab for converting raw content into 8 interactive pedagogical artifact types.
2. **Learning Studio**: Adaptive study paths, active recall routines, and interactive practice arena.
3. **Mentorship**: Socratic AI tutoring, first-principles diagnostics, and learning goal planning.
4. **Omni Copilot**: Real-time contextual assistant grounding every step in STEM invariants.

---

## Technical Stack
- **Frontend**: React 18+ (SPA), Vite, TypeScript, Tailwind CSS, Lucide React.
- **Backend**: Express.js server in `server.ts` running on port 3000, serving API routes at `/api/*` and mounting Vite middleware.
- **AI Gateway**: `@google/genai` with `gemini-3.7-flash`, structured JSON schemas, strict server-side validation.
- **State & Data Store**: In-memory ACID database layer (`server/db.ts`) with snapshot versioning and seed datasets.
