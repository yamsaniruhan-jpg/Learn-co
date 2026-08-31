# Learn.co — AI Architecture & Gateway Specifications

## Core Principles
1. **Server-Side Exclusivity**: All calls to AI providers occur on the server inside `/server/routes/creatorRoutes.ts` or `/server/routes/copilotRoutes.ts`. No API keys are ever transmitted to the client.
2. **Deterministic Model Aliasing**: Production uses `gemini-3.7-flash` via the official `@google/genai` SDK.
3. **Strict JSON Schema Contracts**: Generation prompts explicitly request JSON responses with specified type keys (`flashcards`, `quiz`, `summary`, `notes`, `slides`, `worksheet`, `mindmap`, `keyConcepts`).
4. **Resilient Sanitization**: The backend verifies required fields, strips markdown backticks if returned, and defaults gracefully in case of anomalies.
5. **Pedagogical Invariant Grounding**: Prompts mandate first-principles rigor, LaTeX formula support, and Bloom's taxonomy tags.
