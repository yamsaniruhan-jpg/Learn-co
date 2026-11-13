import { describe, it, expect } from 'vitest';
import { ALL_APP_FEATURES, CATEGORY_ORDER, groupNavFeatures } from '../src/components/layout/MobileAllTabsNav';

describe('mobile feature grouping', () => {
  it('preserves each feature exactly once', () => {
    const groups = groupNavFeatures(ALL_APP_FEATURES);
    expect(groups.flatMap((group) => group.features).map((feature) => feature.id).sort())
      .toEqual(ALL_APP_FEATURES.map((feature) => feature.id).sort());
    expect(new Set(ALL_APP_FEATURES.map((feature) => feature.id)).size).toBe(ALL_APP_FEATURES.length);
  });

  it('orders known categories and keeps core destinations together', () => {
    const groups = groupNavFeatures(ALL_APP_FEATURES);
    expect(groups.map((group) => group.category)).toEqual(CATEGORY_ORDER);
    expect(groups[0].features.map((feature) => feature.id)).toEqual(
      expect.arrayContaining(['dashboard', 'learn', 'practice']),
    );
  });

  it('appends unknown and empty categories without losing features', () => {
    const features = [
      { id: 'z', category: 'Zeta' }, { id: 'c', category: 'Core' },
      { id: 'a', category: 'Alpha' }, { id: 'o', category: '' },
    ];
    const groups = groupNavFeatures(features);
    expect(groups.map((group) => group.category)).toEqual(['Core', 'Alpha', 'Other', 'Zeta']);
    expect(groups.flatMap((group) => group.features).map((feature) => feature.id).sort())
      .toEqual(['a', 'c', 'o', 'z']);
  });
});
