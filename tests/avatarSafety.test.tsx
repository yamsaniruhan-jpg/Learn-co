// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { Avatar } from '../src/components/ui/Avatar';
import { safeAvatarUrl } from '../src/utils/avatarSafety';

describe('avatar privacy and fallback', () => {
  it('does not load a legacy email-seeded DiceBear URL', () => {
    expect(safeAvatarUrl('https://api.dicebear.com/7.x/bottts/svg?seed=alice%40example.test')).toBeUndefined();
    expect(safeAvatarUrl('https://api.dicebear.com/7.x/bottts/svg?seed=anonymous')).toContain('anonymous');
    expect(safeAvatarUrl('/logo-mark.png')).toBe('/logo-mark.png');
  });
  it('renders initials instead of a legacy email URL and falls back after a failed image', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => root.render(<Avatar name="Alice Example" src="https://api.dicebear.com/7.x/bottts/svg?seed=alice%40example.test" />));
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('AE');
    await act(async () => root.render(<Avatar name="Alice Example" src="/broken.png" />));
    expect(container.querySelector('img')).not.toBeNull();
    await act(async () => container.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('AE');
    await act(async () => root.unmount());
  });
});
