import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { MobileAllTabsNav } from '../src/components/layout/MobileAllTabsNav';

describe('mobile navigation rendering', () => {
  it('renders a labelled navigation landmark in its initial state', () => {
    const html = renderToStaticMarkup(
      <AuthProvider><MobileAllTabsNav activeTab="dashboard" setActiveTab={() => {}} dailyAllowanceRemaining={10} /></AuthProvider>,
    );
    expect(html).toMatch(/<nav[^>]*aria-label="Mobile feature navigation"/);
  });
});
