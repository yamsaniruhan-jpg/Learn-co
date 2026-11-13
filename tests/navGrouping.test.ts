import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ALL_APP_FEATURES, CATEGORY_ORDER } from '../src/components/layout/MobileAllTabsNav';

describe('mobile all-features drawer wiring', () => {
  it('uses the shared grouping function to render sections', () => {
    const source = readFileSync('src/components/layout/MobileAllTabsNav.tsx', 'utf8');
    expect(source).toMatch(/groupNavFeatures\(visibleFeatures\)/);
    expect(source).toMatch(/groupedFeatures\.map/);
  });

  it('assigns every current feature to an ordered category', () => {
    expect(ALL_APP_FEATURES.length).toBeGreaterThanOrEqual(21);
    for (const feature of ALL_APP_FEATURES) expect(CATEGORY_ORDER).toContain(feature.category);
  });
});
