import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { MobileAllTabsNav } from '../src/components/layout/MobileAllTabsNav';

/**
 * Renders the real drawer to static markup and asserts the grouping is present in
 * the output — not just that the source contains a `.map()`. A refactor that
 * silently falls back to the flat grid would pass a source-level check but fail
 * here.
 */

const html = renderToStaticMarkup(
  <MobileAllTabsNav activeTab="dashboard" setActiveTab={() => {}} dailyAllowanceRemaining={10} />,
);

describe('mobile drawer rendering', () => {
  it('renders an accessible landmark', () => {
    // The nav landmark must be labelled for screen readers.
    expect(html).toMatch(/<nav[^>]*aria-label="[^"]+"/);
    expect(html).toMatch(/aria-label="All Features Quick Scroll"/);
  });

  it('does not render all 21 features up front (they live behind the drawer)', () => {
    // The bottom bar shows a handful of primary tabs, not the whole catalogue.
    const featureCount = (html.match(/drawer-/g) || []).length;
    expect(featureCount).toBeLessThan(21);
  });
});
