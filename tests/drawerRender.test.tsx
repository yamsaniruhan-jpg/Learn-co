import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { MobileAllTabsNav } from '../src/components/layout/MobileAllTabsNav';

describe('mobile navigation rendering', () => {
  it('renders a labelled navigation landmark in its initial state', () => {
    const html = renderToStaticMarkup(
      <MobileAllTabsNav activeTab="dashboard" setActiveTab={() => {}} dailyAllowanceRemaining={10} />,
    );
    expect(html).toMatch(/<nav[^>]*aria-label="All Features Quick Scroll"/);
  });
});
