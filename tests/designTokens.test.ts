import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DESIGN_TOKENS } from '../src/styles/tokens';

/**
 * The design system had two sources of truth that disagreed:
 *
 *  - `src/index.css`      — the real palette, via CSS custom properties
 *  - `src/styles/tokens.ts` — indigo/Inter values that matched nothing, and which
 *                             no code imported, so the drift was invisible
 *
 * These tests make the drift loud. They also assert the Tailwind v4 `@theme`
 * block exists, because without it the palette generates no utilities at all and
 * components have no choice but to hardcode hex.
 */

const CSS = readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');

/** Read a custom property from the `:root` block. */
function rootVar(name: string): string | null {
  const root = CSS.slice(CSS.indexOf(':root {'), CSS.indexOf('.dark {'));
  const match = root.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

describe('design tokens', () => {
  it('declares a Tailwind v4 @theme block so tokens become utilities', () => {
    expect(CSS).toMatch(/@theme\s*\{/);
    // The named utilities this codebase is expected to use.
    expect(CSS).toMatch(/--color-brand:/);
    expect(CSS).toMatch(/--color-surface:/);
    expect(CSS).toMatch(/--color-ink:/);
  });

  it('uses the fonts that are actually loaded', () => {
    const indexHtml = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const families = [...indexHtml.matchAll(/family=([A-Za-z+]+):/g)].map((m) =>
      m[1].replace(/\+/g, ' '),
    );
    expect(families.length).toBeGreaterThan(0);

    for (const font of DESIGN_TOKENS.typography.fontFamily.sans) {
      // System fallbacks are expected; every *named* font must be loaded.
      if (/^(system-ui|-apple-system|sans-serif|ui-monospace|monospace)$/.test(font)) continue;
      expect(families, `${font} is referenced but never loaded`).toContain(font);
    }
  });

  it('agrees with index.css on the brand colour', () => {
    const cssBrand = rootVar('color-primary');
    expect(cssBrand).toBeTruthy();
    expect(cssBrand!.toLowerCase()).toBe(DESIGN_TOKENS.colors.primary.DEFAULT.toLowerCase());
  });

  it('agrees with index.css on surfaces and text', () => {
    expect(rootVar('color-bg-canvas')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.surface.canvas.toLowerCase(),
    );
    expect(rootVar('color-bg-surface')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.surface.surface.toLowerCase(),
    );
    expect(rootVar('color-text-primary')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.text.primary.toLowerCase(),
    );
    expect(rootVar('color-text-secondary')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.text.secondary.toLowerCase(),
    );
  });

  it('agrees with index.css on status colours', () => {
    expect(rootVar('color-success')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.status.success.toLowerCase(),
    );
    expect(rootVar('color-error')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.status.error.toLowerCase(),
    );
    expect(rootVar('color-accent')!.toLowerCase()).toBe(
      DESIGN_TOKENS.colors.status.warning.toLowerCase(),
    );
  });

  it('does not use the old brand indigo or Inter/Outfit', () => {
    // The *brand* ramps must not be the old indigo. Subject accents are a
    // separate scale that legitimately still contains #4f46e5 (it matches
    // `color` in src/data/curriculumData.ts), so only the brand is checked here.
    expect(DESIGN_TOKENS.colors.primary.DEFAULT.toUpperCase()).toBe('#6C5CE7');
    expect(DESIGN_TOKENS.colors.primary).not.toHaveProperty('600');
    expect(JSON.stringify(DESIGN_TOKENS.typography)).not.toMatch(/"Inter"|"Outfit"/);
  });

  it('subject accents match the curriculum data that renders them', () => {
    const curriculum = readFileSync(
      path.join(process.cwd(), 'src/data/curriculumData.ts'),
      'utf8',
    );
    for (const [key, value] of Object.entries(DESIGN_TOKENS.colors.subjects)) {
      const subject = value as { primary: string; label: string };
      // Only assert for subjects that declare a colour in the curriculum file.
      if (curriculum.includes(`color: '${subject.primary}'`)) continue;
      const subjectId = key === 'cs' ? 'cs' : key;
      if (!curriculum.includes(`id: '${subjectId}'`)) continue;
      // If the subject exists but its colour differs, the token is stale.
      expect(
        curriculum.includes(subject.primary),
        `${key} accent ${subject.primary} is not used in curriculumData.ts`,
      ).toBe(true);
    }
  });
});
