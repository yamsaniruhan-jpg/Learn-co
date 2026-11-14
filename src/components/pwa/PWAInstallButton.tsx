import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, Monitor, X, ExternalLink, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowInstallGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shadow-xs transition cursor-pointer'
            : 'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8577ED] hover:from-[#5B4BC4] hover:to-[#6C5CE7] text-white text-xs font-extrabold shadow-sm transition cursor-pointer'
        }
        title="Install Learn.co as a desktop or mobile app"
      >
        {isIOS ? (
          <Smartphone className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : (
          <Download className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
        {!compact && <span>Install App</span>}
      </button>

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/75 dark:bg-[#100E1C]/85 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Install Learn.co App"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#2A2647] p-6 shadow-2xl border border-[#E3DFF5] dark:border-[#3D3861] space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33] flex items-center justify-center border border-[#E3DFF5] dark:border-[#3D3861]">
                  {isIOS ? (
                    <Smartphone className="w-5 h-5 text-[#6C5CE7]" />
                  ) : (
                    <Monitor className="w-5 h-5 text-[#6C5CE7]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                    Install Learn.co App
                  </h3>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                    Run Learn.co in standalone app mode on desktop or mobile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-xl text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
                aria-label="Close install instructions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInIframe && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Embedded Preview Detected</span>
                </p>
                <p className="leading-relaxed">
                  Browsers block one-click PWA install prompts inside embedded frames. Open the live app URL in its own browser tab, then click <strong>Install App</strong> (or use your browser&apos;s address bar install icon).
                </p>
              </div>
            )}

            {isIOS ? (
              <ol className="text-xs sm:text-sm text-[#2D2A4A] dark:text-[#F1EFFF] space-y-2.5 list-decimal list-inside leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> to launch Learn.co as a native full-screen app.
                </li>
              </ol>
            ) : (
              <div className="space-y-3 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1.5">
                  <p className="font-black text-[#6C5CE7] dark:text-[#8577ED]">
                    Desktop (Chrome / Edge / Brave)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Click the <strong>Install Learn.co</strong> icon on the right side of your address bar, or open the browser menu (&vellip;) &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install Learn.co</strong>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1.5">
                  <p className="font-black text-[#00B8A9]">
                    Android (Chrome)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Tap the browser menu (&vellip;) &rarr; <strong>Add to Home screen</strong> &rarr; <strong>Install</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Includes offline curriculum cache &amp; standalone app window</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold text-sm transition shadow-sm cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
