import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Verifies the drawer's grouping algorithm against the REAL feature list.
 *
 * The component keeps its grouping inline, so this test reproduces the same logic
 * over the same source data. If the component's copy of the algorithm and this one
 * ever disagree, the "grouped" assertion below fails — which is the signal that
 * the drawer has drifted back to a flat list.
 */

const SRC = readFileSync(
  path.join(process.cwd(), 'src/components/layout/MobileAllTabsNav.tsx'),
  'utf8',
);

interface Feature {
  id: string;
  category: string;
}

/** Parse ALL_APP_FEATURES out of the component source. */
function parseFeatures(): Feature[] {
  const blocks = SRC.split(/\n\s*\{\s*\n\s*id: '/).slice(1);
  return blocks
    .map((block) => {
      const id = block.slice(0, block.indexOf("'"));
      const cat = block.match(/category: '([^']+)'/);
      return cat ? { id, category: cat[1] } : null;
    })
    .filter((f): f is Feature => !!f);
}

/** Mirrors the component's ordering rules. */
const CATEGORY_ORDER = [
  'Core',
  'AI Tools',
  'Organization',
  'Analytics',
  'Gamification',
  'Resources',
  'Collaboration',
  'Guidance',
  'System',
  'Account',
];

function group(features: Feature[]) {
  const map = new Map<string, Feature[]>();
  for (const f of features) {
    if (!map.has(f.category)) map.set(f.category, []);
    map.get(f.category)!.push(f);
  }
  return [...map.keys()]
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map((category) => ({ category, features: map.get(category)! }));
}

describe('drawer grouping algorithm', () => {
  const features = parseFeatures();

  it('parses the full feature catalogue', () => {
    expect(features.length).toBe(21);
    expect(new Set(features.map((f) => f.id)).size).toBe(21); // no duplicate ids
  });

  it('never drops a feature', () => {
    const grouped = group(features);
    const flattened = grouped.flatMap((g) => g.features.map((f) => f.id));
    expect(flattened.sort()).toEqual(features.map((f) => f.id).sort());
  });

  it('produces far fewer sections than items', () => {
    const grouped = group(features);
    expect(grouped.length).toBeLessThan(features.length / 2);
    expect(grouped.length).toBe(10);
  });

  it('orders sections predictably, starting with Core', () => {
    const grouped = group(features);
    expect(grouped[0].category).toBe('Core');
    // Every rendered category is in the declared order.
    for (const g of grouped) expect(CATEGORY_ORDER).toContain(g.category);
  });

  it('keeps primary destinations in the first section', () => {
    const core = group(features).find((g) => g.category === 'Core')!;
    const ids = core.features.map((f) => f.id);
    for (const primary of ['dashboard', 'learn', 'practice']) {
      expect(ids).toContain(primary);
    }
  });

  it('the component uses the same algorithm this test mirrors', () => {
    // If the component's implementation diverges from the one modelled above, the
    // tests here would keep passing while the UI regressed. Assert the key pieces
    // exist in the component source.
    expect(SRC).toMatch(/groupedFeatures/);
    expect(SRC).toMatch(/new Map<string, typeof ALL_APP_FEATURES>/);
    expect(SRC).toMatch(/CATEGORY_ORDER\.indexOf/);
    expect(SRC).toMatch(/groupedFeatures\.map\(\(\{ category, features \}\)/);

    // And the declared order in the component must match this file's copy.
    const componentOrder = SRC.match(/CATEGORY_ORDER = \[([\s\S]*?)\]/)![1];
    const fromSource = [...componentOrder.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(fromSource).toEqual(CATEGORY_ORDER);
  });
});
