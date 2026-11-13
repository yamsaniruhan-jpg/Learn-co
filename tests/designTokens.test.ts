import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DESIGN_TOKENS } from '../src/styles/tokens';

// Guard the shared subset of JavaScript and CSS design values against drift.
const CSS = readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');

/** Read a custom property from the `:root` block. */
function rootVar(name: string): string | null {
  const root = CSS.slice(CSS.indexOf(':root {'), CSS.indexOf('.dark {'));
  const match = root.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

describe('design tokens', () => {
  it('declares a Tailwind v4 @theme block so tokens become utilities', () => {
    expect(CSS).toMatch(/@theme\s+inline\s*\{/);
    // Named utilities are mapped to semantic variables.
    expect(CSS).toMatch(/--color-brand:\s*var\(--color-primary\)/);
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

});
