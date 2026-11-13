import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Guards the Track D code-splitting work.
 *
 * `lazyNamed` resolves a *named* export at runtime. If a view were ever renamed,
 * or a named export changed to a default export, the failure would only show up
 * as a blank tab in the browser. These tests catch that at build time by
 * asserting the export `App.tsx` asks for actually exists in the module.
 */

const ROOT = process.cwd();

// Mirrors the `lazyNamed(() => import(...), 'Name')` declarations in App.tsx.
const LAZY_VIEWS: Array<[string, string]> = [
  ['DashboardView', 'src/components/dashboard/DashboardView'],
  ['LearnView', 'src/components/learn/LearnView'],
  ['CreatorStudioView', 'src/components/create/CreatorStudioView'],
  ['MentorView', 'src/components/mentor/MentorView'],
  ['CopilotView', 'src/components/copilot/CopilotView'],
  ['PracticeView', 'src/components/practice/PracticeView'],
  ['PlannerView', 'src/components/planner/PlannerView'],
  ['GamificationView', 'src/components/gamification/GamificationView'],
  ['IntelligenceView', 'src/components/intelligence/IntelligenceView'],
  ['AdminStudioView', 'src/components/admin/AdminStudioView'],
  ['DocsViewer', 'src/components/docs/DocsViewer'],
  ['ProfileView', 'src/components/profile/ProfileView'],
  ['AuthView', 'src/components/auth/AuthView'],
  ['Leaderboard', 'src/components/leaderboard/Leaderboard'],
  ['ConceptLibraryView', 'src/components/concepts/ConceptLibraryView'],
  ['DigitalArchiveHub', 'src/components/learn/DigitalArchiveHub'],
  ['SimulationsHubView', 'src/components/simulations/SimulationsHubView'],
  ['UserGuideView', 'src/components/guide/UserGuideView'],
  ['GenFocusTimerView', 'src/components/focus/GenFocusTimerView'],
  ['StudyRoomsView', 'src/components/common/StudyRoomsView'],
  ['VoiceExamView', 'src/components/common/VoiceExamView'],
  ['ExamForecasterView', 'src/components/common/ExamForecasterView'],
  ['OfflineSyncView', 'src/components/common/OfflineSyncView'],
  ['FormulaInspectorModal', 'src/components/common/FormulaInspectorModal'],
  ['FlashCheckModal', 'src/components/practice/FlashCheckModal'],
  ['WalkthroughModal', 'src/components/common/WalkthroughModal'],
  ['NotificationCenter', 'src/components/layout/NotificationCenter'],
];

describe('lazy-loaded views', () => {
  it.each(LAZY_VIEWS)('%s module exists and exports that name', async (name, relPath) => {
    const mod: Record<string, unknown> = await import(path.join(ROOT, relPath));
    expect(mod[name], `${relPath} must export "${name}"`).toBeDefined();
    expect(typeof mod[name]).toBe('function');
  });

  it('every lazy declaration in App.tsx is covered by this test', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const app = readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
    const declared = [...app.matchAll(/const (\w+) = lazyNamed\(/g)].map((m) => m[1]);
    const covered = new Set(LAZY_VIEWS.map(([n]) => n));
    const uncovered = declared.filter((n) => !covered.has(n));
    expect(uncovered, `add these to LAZY_VIEWS: ${uncovered.join(', ')}`).toEqual([]);
  });

  it('every lazy usage sits inside a Suspense boundary', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const app = readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
    const lazyNames = [...app.matchAll(/const (\w+) = lazyNamed\(/g)].map((m) => m[1]);

    // A lazy component rendered outside Suspense throws at runtime. Walk the file
    // tracking Suspense nesting depth and assert none are used at depth 0.
    let depth = 0;
    const uncovered: string[] = [];
    app.split('\n').forEach((line) => {
      if (line.includes('<Suspense')) depth += 1;
      for (const n of lazyNames) {
        if (new RegExp(`<${n}\\b`).test(line) && depth === 0) uncovered.push(n);
      }
      if (line.includes('</Suspense>')) depth -= 1;
    });
    expect(uncovered, `not wrapped in Suspense: ${uncovered.join(', ')}`).toEqual([]);
  });
});

describe('resolveNamedExport', () => {
  it('returns the component for a name the module exports', async () => {
    const { resolveNamedExport } = await import(path.join(ROOT, 'src/utils/lazyNamed'));
    const Component = () => null;
    const resolved = await resolveNamedExport(async () => ({ Real: Component }), 'Real');
    expect(resolved).toBe(Component);
  });

  it('throws a descriptive error for a missing export instead of returning undefined', async () => {
    const { resolveNamedExport } = await import(path.join(ROOT, 'src/utils/lazyNamed'));
    await expect(
      resolveNamedExport(async () => ({ Real: () => null }), 'Missing' as never),
    ).rejects.toThrow(/does not export "Missing"/);
  });

  it('lists available exports in the error to make the fix obvious', async () => {
    const { resolveNamedExport } = await import(path.join(ROOT, 'src/utils/lazyNamed'));
    await expect(
      resolveNamedExport(async () => ({ Alpha: () => null, Beta: () => null }), 'Gamma' as never),
    ).rejects.toThrow(/Alpha, Beta/);
  });
});
