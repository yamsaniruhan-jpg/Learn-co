// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
const device = vi.hoisted(() => ({ isIOS: false, isMobile: true, isInstallable: false, isInstalled: false, install: vi.fn() }));
vi.mock('../src/components/pwa/usePWAInstall', () => ({ usePWAInstall: () => device }));
import { PWAInstallButton } from '../src/components/pwa/PWAInstallButton';

let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; });
async function openGuide(isIOS: boolean) {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  device.isIOS = isIOS;
  const container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root!.render(<PWAInstallButton />));
  const button = container.querySelector('button')!;
  expect(button.textContent).toContain('Add to mobile');
  await act(async () => button.click());
  return container;
}
describe('mobile install guidance', () => {
  it('explains the Safari Share menu on iPhone', async () => {
    const container = await openGuide(true);
    expect(container.textContent).toContain('Share');
    expect(container.textContent).toContain('Add to Home Screen');
    expect(container.textContent).not.toContain('Download Desktop File');
    expect(container.textContent).toContain('not an APK');
  });
  it('explains the Android browser menu and closes on Escape', async () => {
    const container = await openGuide(false);
    expect(container.textContent).toContain('Add to Home screen');
    expect(container.textContent).not.toContain('Windows (.bat)');
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
  it('promotes direct Home Screen installation on desktop without desktop file downloads', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    device.isIOS = false;
    device.isMobile = false;
    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root!.render(<PWAInstallButton />));
    const button = container.querySelector('button')!;
    await act(async () => button.click());
    expect(container.textContent).toContain('Add LearnCo to Home Screen');
    expect(container.textContent).not.toContain('Desktop File (.html)');
    expect(container.textContent).not.toContain('Save Clickable App File');
    expect(container.textContent).toContain('Install LearnCo');
  });
});
