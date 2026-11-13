import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Guards the mobile "All features" drawer.
 *
 * All 21 features declare a `category`, but the drawer rendered them in one flat
 * grid, so the category data was dead weight and the most-used navigation surface
 * was a 21-item wall. These tests keep the grouping (and the full feature set)
 * from regressing.
 */

const SRC = readFileSync(
  path.join(process.cwd(), 'src/components/layout/MobileAllTabsNav.tsx'),
  'utf8',
);

function featureEntries() {
  // Match each { id: 'x', ... category: 'Y' } block inside ALL_APP_FEATURES.
  const blocks = SRC.split(/\n\s*\{\s*\n\s*id: '/).slice(1);
  return blocks
    .map((block) => {
      const id = block.slice(0, block.indexOf("'"));
      const cat = block.match(/category: '([^']+)'/);
      return { id, category: cat ? cat[1] : null };
    })
    .filter((f) => f.id);
}

describe('mobile all-features drawer', () => {
  it('renders features grouped, not as one flat list', () => {
    expect(SRC).toMatch(/groupedFeatures\.map/);
    // The old flat render must be gone from the drawer.
    expect(SRC).not.toMatch(/\{ALL_APP_FEATURES\.map\(\(feat\) => \{[\s\S]{0,2000}Grid of All Features/);
  });

  it('keeps every feature and infers its category', () => {
    const entries = featureEntries();
    expect(entries.length).toBeGreaterThanOrEqual(21);
    const missing = entries.filter((e) => !e.category);
    expect(missing.map((m) => m.id), 'every feature needs a category').toEqual([]);
  });

  it('groups into a small number of scannable sections', () => {
    const categories = new Set(featureEntries().map((e) => e.category));
    // Grouped navigation is the point: a handful of sections, not 21 siblings.
    expect(categories.size).toBeGreaterThan(3);
    expect(categories.size).toBeLessThan(12);
  });

  it('declares an explicit category order covering every used category', () => {
    const orderMatch = SRC.match(/CATEGORY_ORDER = \[([\s\S]*?)\]/);
    expect(orderMatch).toBeTruthy();
    const order = [...orderMatch![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(order.length).toBeGreaterThan(0);

    // Unlisted categories still render (appended), but every real category should
    // be listed so the order is intentional rather than accidental.
    const used = new Set(featureEntries().map((e) => e.category));
    const unlisted = [...used].filter((c) => !order.includes(c as string));
    expect(unlisted, 'add these to CATEGORY_ORDER').toEqual([]);
  });
});
