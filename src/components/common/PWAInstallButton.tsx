// src/components/common/PWAInstallButton.tsx
import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running in standalone mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6C5CE7] hover:bg-[#5B4BC4] rounded-lg shadow-sm transition-colors border border-[#5B4BC4] cursor-pointer"
        title="Install LearnCo as a native app"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#6C5CE7] dark:text-[#8577ED] bg-[#F0EDFA] dark:bg-[#1E1B33] hover:bg-[#E3DFF5] dark:hover:bg-[#3D3861] rounded-lg transition-colors border border-[#E3DFF5] dark:border-[#3D3861] cursor-pointer"
          title="Install LearnCo on iOS"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#2A2647] p-5 shadow-2xl border border-[#E3DFF5] dark:border-[#3D3861] text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#6B6890] dark:text-[#B4B0D5] mb-4 leading-relaxed">
                1. Tap the <strong>Share</strong> button (box with upward arrow) in the Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#6C5CE7] text-white py-2 text-sm font-semibold hover:bg-[#5B4BC4] transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
