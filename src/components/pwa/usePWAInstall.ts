import { useSyncExternalStore } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
type InstallResult = 'accepted' | 'dismissed' | 'unavailable' | 'failed';
type InstallState = { prompt: BeforeInstallPromptEvent | null; installed: boolean };

// Capture the one-shot browser event as soon as this module loads, not only
// while a particular button is mounted. All buttons share the same event.
let state: InstallState = { prompt: null, installed: false };
const listeners = new Set<() => void>();
const update = (next: InstallState) => { state = next; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => state;
const isStandalone = () => typeof window !== 'undefined' && (
  (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true
);

if (typeof window !== 'undefined') {
  state = { prompt: null, installed: isStandalone() };
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    if (!state.installed) update({ ...state, prompt: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => update({ prompt: null, installed: true }));
  if (typeof window.matchMedia === 'function') {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    displayMode.addEventListener?.('change', () => update({ ...state, installed: isStandalone() }));
  }
}

async function install(): Promise<InstallResult> {
  const prompt = state.prompt;
  if (!prompt) return 'unavailable';
  // A browser prompt is single-use even when the user dismisses it.
  update({ ...state, prompt: null });
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    // Acceptance is not proof the app has installed. Wait for appinstalled or
    // standalone display mode before showing an installed state.
    return choice.outcome;
  } catch {
    return 'failed';
  }
}

export function usePWAInstall() {
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isIOS || /android/.test(ua);
  return { isInstallable: !!current.prompt, isInstalled: current.installed, isIOS, isMobile, install };
}
