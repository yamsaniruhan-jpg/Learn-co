import React, { useState } from 'react';
import {
  FileCode2,
  BookOpen,
  Layers,
  ShieldCheck,
  Compass,
  Cpu,
  Database,
  Search,
} from 'lucide-react';
import { Card } from '../ui/Card';
import Markdown from 'react-markdown';

interface DocArticle {
  id: string;
  title: string;
  category: 'Foundation' | 'Design System' | 'Architecture' | 'AI & Security';
  content: string;
}

const DOCS_DATA: DocArticle[] = [
  {
    id: 'vol9-adaptive-analytics',
    title: 'Volume 9: Adaptive Learning & Analytics Engine',
    category: 'Architecture',
    content: `## Learn.co Volume 9 — Adaptive Learning & Analytics Engine Specification

### 1. Empirical Multi-Factor Mastery Equation
Concept mastery $M(c) \\in [0, 100]$ is computed deterministically across all historical attempts:

$$M(c) = 0.40 \\cdot A_{eff} + 0.25 \\cdot D_{res} + 0.20 \\cdot R(t) + 0.15 \\cdot \\text{Recency} - \\text{MistakePenalty}$$

* **$A_{eff}$ (Effective Accuracy)**: Baseline accuracy penalized by hints used ($0.12 \\times \\text{hintsUsedCount}$).
* **$D_{res}$ (Difficulty Resilience)**: Weighted normalized score across attempted difficulties (Easy: 0.60, Medium: 0.85, Hard: 1.00).
* **$R(t)$ (Retention Strength)**: Ebbinghaus exponential decay $R(t) = 100 \\cdot e^{-0.05 \\cdot t_{days}}$.
* **$\\text{Recency}$**: Rolling accuracy across the 5 most recent attempts.
* **$\\text{MistakePenalty}$**: Penalty of $5\\%$ per unresolved active mistake in the topic.

### 2. Five Mastery Status Bands
* **MASTERED** ($M \\ge 80\\%$): High cognitive stability; candidates for review every 14 days.
* **PROFICIENT** ($65\\% \\le M < 80\\%$): Solid foundational understanding; candidates for calibrated difficulty climbing.
* **FAMILIAR** ($50\\% \\le M < 65\\%$): Needs scaffolded practice.
* **LEARNING** ($M < 50\\%$): Active concept acquisition phase.
* **DECAYED**: High decay risk ($R(t) < 60\\%$ or $>7$ days inactive since practice).

### 3. Exam Readiness Modeling
Readiness for target exam tracks (JEE Advanced, JEE Main, AI & ML Foundations, AP STEM, STEM Olympiad) is modeled using:
* **Syllabus Coverage** ($35\\%$ weight)
* **Concept Mastery** ($35\\%$ weight)
* **Historical Calibrated Accuracy** ($20\\%$ weight)
* **Practice Volume** ($10\\%$ weight)

Readiness Bands: **READY** ($\\ge 80\\%$), **NEAR_READY** ($65-79\\%$), **PROGRESSING** ($45-64\\%$), **EARLY_STAGE** ($<45\\%$).

### 4. Socratic AI Diagnostic Synthesizer
Powered by Gemini server-side via the unified AI Gateway, generating cognitive profiles, trap diagnoses, and tailored pedagogical prescriptions with zero key exposure.`,
  },
  {
    id: 'vol2-design-system',
    title: 'Volume 2: Design System & Tokens',
    category: 'Design System',
    content: `## Learn.co Design System Specification — Volume 2

### 1. Architectural Philosophy
* **Clarity over Decoration**: Every pixel, margin, and typography step serves a cognitive learning function.
* **Minimal Cognitive Load**: High-contrast, mathematically structured layouts that direct student focus strictly to the problem or derivation.
* **Integrated Socratic AI**: AI never floats as an intrusive modal; it behaves as an ambient context companion with First-Principles and Step-by-Step proofs.

### 2. Semantic Token Hierarchy
* **Primary Brand**: Deep Indigo (\`#4f46e5\`, \`#6366f1\`) & Electric Iris
* **Secondary Accent**: Azure / Cyan (\`#0284c7\`, \`#06b6d4\`)
* **XP / Economy**: Amber Gold (\`#f59e0b\`)
* **Streak Indicator**: Radiant Flame (\`#f97316\`)
* **Mastery Spectrum**: Emerald (\`#10b981\`) for verified concepts; Rose (\`#f43f5e\`) for cognitive decay risks.

### 3. Application Shell Topology
* **Header / Navbar**: Brand mark, command search trigger (⌘K), daily quota counter, streak/XP badges, theme switcher (Light/Dark), user profile.
* **Desktop Sidebar**: Collapsible navigation with Core Learning, AI Creation, and Analytics sections.
* **Context Companion Panel**: Instant Socratic assistance accessible from any active view.
* **Mobile Bottom Bar**: 44px+ touch-optimized targets for on-the-go practice.`,
  },
  {
    id: 'prd-v2',
    title: 'Product Requirements (PRD)',
    category: 'Foundation',
    content: `## Learn.co Product Requirements Document (PRD)

### Executive Summary
Learn.co is an intelligent STEM learning platform combining interactive concept exploration, calibrated diagnostic practice ladders, AI notes synthesis, personal memory retention modeling (Ebbinghaus forgetting curve), and Socratic AI tutoring.

### Core Modules
1. **Interactive Concept Exploration**: Step-by-step invariant proofs with interactive widgets and check questions.
2. **5-Question Calibrated Ladder**: Real-time diagnostic practice with progressive hints and XP economy.
3. **AI Creator Studio**: Ingest notes/PDFs into flashcards, quizzes, and summaries.
4. **Cognitive Memory Diagnostics**: Ebbinghaus retention forecasts and weekly study prescriptions.
5. **Study Planner & Timetable**: Daily schedule balancing and exam countdown pacing.`,
  },
  {
    id: 'mastery-formula',
    title: 'Mastery & Retention Engine',
    category: 'Architecture',
    content: `## Empirical Concept Mastery Formula

Concept mastery $M(c) \\in [0, 100]$ is computed using a multi-factor empirical equation:

$$M(c) = 0.45 \\cdot A_{eff} + 0.25 \\cdot D_{res} + 0.20 \\cdot R(t) + 0.10 \\cdot S$$

Where:
* **$A_{eff}$ (Effective Accuracy)**: Raw attempt accuracy adjusted for hint revelation penalties ($A_{eff} = A_{raw} - 0.10 \\times \\text{hints}$).
* **$D_{res}$ (Difficulty Resilience)**: Performance on higher Bloom-taxonomy items.
* **$R(t)$ (Retention Factor)**: Projected memory decay based on time elapsed: $R(t) = 100 \\cdot e^{-0.06 \\cdot t_{days}}$.
* **$S$ (Consistency Factor)**: Rolling accuracy across the last 5 consecutive attempts.`,
  },
  {
    id: 'ai-architecture',
    title: 'AI Gateway & Security Rules',
    category: 'AI & Security',
    content: `## AI Gateway & Security Architecture

### Socratic Guardrails
* The AI Copilot is strictly bounded to refuse direct answer generation when in \`socratic_hint\` mode.
* System instructions enforce the step-invariant framework: identify invariants, test boundaries, verify concavity.

### API Key Security & Full-Stack Boundary
* All Gemini API keys and sensitive server tokens remain strictly server-side in \`server.ts\` via \`/api/*\` proxy routes.
* Client-side code accesses public endpoints with zero key leakage.`,
  },
];

export const DocsViewer: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('vol2-design-system');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeDoc = DOCS_DATA.find((d) => d.id === selectedDocId) || DOCS_DATA[0];

  const filteredDocs = DOCS_DATA.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Architectural Specifications</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Specs & System Documentation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Official Volume 1 & Volume 2 architecture, design tokens, data models, and empirical formulas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Article Index (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <Card
                key={doc.id}
                variant={selectedDocId === doc.id ? 'elevated' : 'interactive'}
                padding="md"
                onClick={() => setSelectedDocId(doc.id)}
                className={`transition-all ${
                  selectedDocId === doc.id
                    ? 'border-indigo-600 ring-1 ring-indigo-500/30'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {doc.category}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {doc.title}
                </h3>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Markdown Content Display (8 cols) */}
        <div className="lg:col-span-8">
          <Card variant="elevated" padding="lg" className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{activeDoc.content}</Markdown>
          </Card>
        </div>
      </div>
    </div>
  );
};
