// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePWAInstall } from '../src/components/pwa/usePWAInstall';

let current: ReturnType<typeof usePWAInstall>;
function Probe() { current = usePWAInstall(); return <span>{current.isInstallable ? 'ready' : current.isInstalled ? 'installed' : 'unavailable'}</span>; }
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await act(async () => root.unmount()); });
function browserPrompt(outcome: 'accepted' | 'dismissed', fail = false) {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, { prompt: vi.fn(fail ? async () => { throw Error('blocked'); } : async () => {}), userChoice: Promise.resolve({ outcome, platform: 'web' }) });
}
async function mount() {
  const div = document.createElement('div');
  const root = createRoot(div); roots.push(root);
  await act(async () => root.render(<Probe />));
  return div;
}

describe('PWA installation', () => {
  it('captures a prompt before mounting, consumes dismissal, and handles a later prompt', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const first = browserPrompt('dismissed');
    window.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    const div = await mount();
    expect(div.textContent).toBe('ready');
    await act(async () => { expect(await current.install()).toBe('dismissed'); });
    expect(div.textContent).toBe('unavailable');
    expect(await current.install()).toBe('unavailable');
    const blocked = browserPrompt('dismissed', true);
    await act(async () => { window.dispatchEvent(blocked); });
    await act(async () => { expect(await current.install()).toBe('failed'); });
    expect(div.textContent).toBe('unavailable');
    const second = browserPrompt('accepted');
    await act(async () => { window.dispatchEvent(second); });
    await act(async () => { expect(await current.install()).toBe('accepted'); });
    expect(div.textContent).toBe('unavailable');
    await act(async () => { window.dispatchEvent(new Event('appinstalled')); });
    expect(div.textContent).toBe('installed');
  });
});
