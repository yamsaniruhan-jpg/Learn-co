import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, CheckCircle2, MoreVertical, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { OfflineStorageManager } from '../../utils/offlineStorage';

const DISMISS_STORAGE_KEY = 'learnco_ios_install_banner_dismissed_v1';

export const IOSInstallBanner: React.FC = () => {
  const { isIOS, isMobile, isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [dwellElapsed, setDwellElapsed] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);

  useEffect(() => {
    if (!isMobile || isInstalled || dismissed) return;
    const timer = window.setTimeout(() => {
      setDwellElapsed(true);
    }, 10500);
    return () => window.clearTimeout(timer);
  }, [isMobile, isInstalled, dismissed]);

  if (!isMobile || isInstalled || dismissed || !dwellElapsed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    setShowStepsModal(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    } catch {
      // ignore storage failure
    }
  };

  const handlePrimaryAction = async () => {
    void OfflineStorageManager.prepareMobileHomeScreenPackage();
    if (isInstallable) {
      const result = await install();
      if (result === 'accepted' || result === 'dismissed') return;
    }
    setShowStepsModal(true);
  };

  return (
    <>
      <div
        role="region"
        aria-label="Install LearnCo on Mobile Home Screen"
        className="fixed inset-x-0 bottom-20 md:bottom-4 z-40 px-3 pt-2 pointer-events-none"
      >
        <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl bg-[#2D2A4A] text-white border border-[#4B4578] shadow-xl px-3.5 py-2 flex items-center justify-between gap-2.5 max-h-[15vh]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icons/icon-192.png"
              alt="LearnCo Home Screen Icon"
              className="w-9 h-9 rounded-xl border border-[#6C5CE7]/50 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Add LearnCo to Home Screen</div>
              <div className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                {isIOS ? (
                  <>
                    <span>Tap</span>
                    <Share className="w-3 h-3 inline shrink-0" />
                    <span>then Add to Home Screen</span>
                  </>
                ) : (
                  <>
                    <MoreVertical className="w-3 h-3 inline shrink-0" />
                    <span>Offline study pack &amp; cloud sync ready</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              {isInstallable ? <Download className="w-3.5 h-3.5" /> : null}
              <span>{isInstallable ? 'Install' : 'How'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss Home Screen install hint"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showStepsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Home Screen Install Instructions"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/icon-192.png"
                  alt="LearnCo Home Screen Icon"
                  className="w-9 h-9 rounded-xl border border-[#6C5CE7]/40 shrink-0 object-cover"
                />
                <h3 className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                  {isIOS ? 'Install on iPhone & iPad' : 'Install on Android Phone'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStepsModal(false)}
                aria-label="Close instructions"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <ol className="text-xs text-[#2D2A4A] dark:text-[#F1EFFF] space-y-3">
                <li className="flex items-start gap-2.5">
                  <Share className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <span>
                    1. Tap Safari&apos;s <strong>Share</strong> button at the bottom or top toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <span>
                    2. Scroll down and select <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    3. Tap <strong>Add</strong> for full-screen offline Olympiad study access.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="text-xs text-[#2D2A4A] dark:text-[#F1EFFF] space-y-3">
                <li className="flex items-start gap-2.5">
                  <MoreVertical className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <span>
                    1. Tap your browser menu icon in the top-right corner of Chrome or Edge.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <span>
                    2. Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    3. Launch LearnCo directly from your Home Screen with automatic offline sync.
                  </span>
                </li>
              </ol>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Don&apos;t Show Again
              </button>
              <button
                type="button"
                onClick={() => setShowStepsModal(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-[#6C5CE7] text-white text-xs font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
