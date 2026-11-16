import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const DISMISS_STORAGE_KEY = 'learnco_ios_install_banner_dismissed_v1';

export const IOSInstallBanner: React.FC = () => {
  const { isIOS, isInstalled } = usePWAInstall();
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
    if (!isIOS || isInstalled || dismissed) return;
    const timer = window.setTimeout(() => {
      setDwellElapsed(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [isIOS, isInstalled, dismissed]);

  if (!isIOS || isInstalled || dismissed || !dwellElapsed) {
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

  return (
    <>
      <div
        role="region"
        aria-label="Install LearnCo on iPhone or iPad"
        style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
        className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 pointer-events-none"
      >
        <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl bg-[#2D2A4A] text-white border border-[#4B4578] shadow-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 max-h-[15vh]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#6C5CE7] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Add LearnCo to Home Screen</div>
              <div className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                <span>Tap</span>
                <Share className="w-3 h-3 inline shrink-0" />
                <span>then Add to Home Screen</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowStepsModal(true)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold cursor-pointer"
            >
              How
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
          aria-label="iOS Home Screen Install Instructions"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                Install on iPhone &amp; iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowStepsModal(false)}
                aria-label="Close instructions"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
