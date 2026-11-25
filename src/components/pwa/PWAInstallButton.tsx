import React, { useEffect, useRef, useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { OfflineStorageManager } from '../../utils/offlineStorage';
import {
  Download,
  Smartphone,
  X,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Wifi,
  Share,
  MoreVertical,
} from 'lucide-react';

export const PWAInstallButton: React.FC<{
  compact?: boolean;
  compactLabel?: string;
  label?: string;
  className?: string;
}> = ({ compact, compactLabel, label, className }) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [syncingPack, setSyncingPack] = useState(false);
  const [packMessage, setPackMessage] = useState<string | null>(() => {
    const existing = OfflineStorageManager.getMobileHomeScreenPackageStatus();
    if (!existing) return null;
    const filesLabel = existing.filesCachedCount > 0 ? `${existing.filesCachedCount} app files & ` : '';
    return `Stored ${filesLabel}${existing.questionsCount} problems (${existing.approxSizeKb} KB) + Home Screen icon on device.`;
  });
  const [swReady, setSwReady] = useState(false);
  const preparedThisSessionRef = useRef(false);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const swSupported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const appOriginUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://learn-co.ai.studio/';

  const runHomeScreenFileSync = async (alsoSyncAttempts = false) => {
    setSyncingPack(true);
    try {
      const status = await OfflineStorageManager.prepareMobileHomeScreenPackage();
      const synced = alsoSyncAttempts ? await OfflineStorageManager.syncPendingAttemptsToServer() : 0;
      const filesLabel = status.filesCachedCount > 0 ? `${status.filesCachedCount} app files & ` : '';
      setPackMessage(
        `Stored ${filesLabel}${status.questionsCount} problems (${status.approxSizeKb} KB) + Home Screen icon on device${synced > 0 ? ` • synced ${synced} attempts` : ''}.`
      );
      preparedThisSessionRef.current = true;
    } catch {
      setPackMessage('Could not cache the study pack. Please check storage and try again.');
    } finally {
      setSyncingPack(false);
    }
  };

  useEffect(() => {
    if (!showInstallGuide) return;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInstallGuide(false);
    };
    window.addEventListener('keydown', handleKey);

    if (swSupported) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => setSwReady(Boolean(reg?.active || reg?.installing || reg?.waiting)))
        .catch(() => setSwReady(false));
    }

    if (!preparedThisSessionRef.current) {
      void runHomeScreenFileSync(false);
    }

    return () => {
      window.removeEventListener('keydown', handleKey);
      triggerRef.current?.focus();
    };
  }, [showInstallGuide, swSupported]);

  const handleClick = async () => {
    if (!preparedThisSessionRef.current) {
      void runHomeScreenFileSync(false);
    }
    if (isInstallable) {
      const result = await install();
      if (result === 'accepted' || result === 'dismissed') return;
    }
    setShowInstallGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appOriginUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  if (isInstalled) return null;

  const buttonLabel = label || (isMobile ? 'Add to mobile' : 'Install App');

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        aria-label={isMobile ? 'Add LearnCo to mobile' : 'Install LearnCo'}
        className={
          className ||
          (compact
            ? 'w-full flex items-center justify-center gap-1 px-2.5 py-2 rounded-full bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-[11px] font-bold shadow-xs transition cursor-pointer'
            : 'flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8577ED] hover:from-[#5B4BC4] hover:to-[#6C5CE7] text-white text-xs font-extrabold shadow-sm transition cursor-pointer')
        }
        title="Add LearnCo directly to your Home Screen"
      >
        {isIOS || isMobile ? (
          <Smartphone className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        ) : (
          <Download className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        )}
        {compact ? (compactLabel ? <span>{compactLabel}</span> : null) : <span>{buttonLabel}</span>}
      </button>

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/75 dark:bg-[#100E1C]/85 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Add LearnCo to Home Screen"
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2A2647] p-6 shadow-2xl border border-[#E3DFF5] dark:border-[#3D3861] space-y-5 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#01000E] flex items-center justify-center border border-[#6C5CE7]/50 overflow-hidden shrink-0 shadow-sm">
                  <img
                    src="/icons/icon-192.png"
                    alt="LearnCo Home Screen Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                    {isMobile ? 'Add LearnCo to your mobile' : 'Add LearnCo to Home Screen'}
                  </h3>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                    Stores app files &amp; places the LearnCo icon on your Home Screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                ref={closeRef}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer shrink-0"
                aria-label="Close install instructions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live App Readiness Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2 text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isInstallable || isInstalled ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span>{isInstallable ? '1-Tap Install Ready' : 'Use Browser Install'}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2 text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                <Wifi className={`w-4 h-4 shrink-0 ${swReady || swSupported ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{swReady ? 'Service Worker Active' : swSupported ? 'Offline Cache Ready' : 'Offline Unsupported'}</span>
              </div>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  const res = await install();
                  if (res === 'accepted') setShowInstallGuide(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0D9488] hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Add Directly to Home Screen Now</span>
              </button>
            )}

            {isInIframe && (
              <div className="p-3.5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Open Outside Embedded Preview to Install</span>
                </p>
                <p className="leading-relaxed">
                  Browsers block Home Screen install prompts inside an embedded preview frame. Open LearnCo in a standalone browser tab first, then tap Add to Home Screen.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={appOriginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-[#2A2647] border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-xs cursor-pointer transition"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Link Copied' : 'Copy App Link'}</span>
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
              This adds LearnCo straight to your Home Screen or Desktop Apps — not an APK or file download. Signing in and loading fresh cloud drills still require a connection.
            </p>

            {isIOS ? (
              <ol className="text-xs sm:text-sm text-[#2D2A4A] dark:text-[#F1EFFF] space-y-2.5 bg-[#F7F5FF] dark:bg-[#1E1B33] p-4 rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] leading-relaxed">
                <li className="flex items-start gap-2">
                  <Share className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <span>
                    1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                  </span>
                </li>
                <li>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  3. Tap <strong>Add</strong>. Then launch LearnCo directly from your Home Screen.
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <p className="font-black text-[#00B8A9] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android (Chrome / Edge / Samsung Internet)</span>
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Tap the browser menu (<MoreVertical className="w-3 h-3 inline" />) &rarr; <strong>Add to Home screen</strong> &rarr; <strong>Install</strong> to place LearnCo directly on your Home Screen.
                  </p>
                </div>
                {!isMobile && (
                  <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                    <p className="font-black text-[#6C5CE7] dark:text-[#8577ED]">
                      Desktop Direct App Install (Chrome / Edge)
                    </p>
                    <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                      Click the <strong>Install</strong> icon on the right side of the address bar, or open menu (&vellip;) &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install LearnCo</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
              <button
                type="button"
                disabled={syncingPack}
                onClick={async () => {
                  setPackMessage(null);
                  await runHomeScreenFileSync(true);
                }}
                className="w-full min-h-[44px] rounded-xl bg-[#00B8A9] hover:bg-[#009c8f] px-4 py-2 font-bold text-white disabled:opacity-60 cursor-pointer"
              >
                {syncingPack ? 'Storing files & Home Screen pack...' : 'Cache & Sync Offline Study Pack'}
              </button>
              {packMessage && <p role="status" className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{packMessage}</p>}
              <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">Saved practice may need a connection and an active session to sync.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-full bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold text-sm transition shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
