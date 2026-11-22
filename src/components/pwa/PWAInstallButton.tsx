import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { OfflineStorageManager } from '../../utils/offlineStorage';
import {
  Download,
  Smartphone,
  X,
  ExternalLink,
  CheckCircle2,
  FileDown,
  Laptop,
  Copy,
  Check,
  Wifi,
} from 'lucide-react';

type ShortcutOS = 'windows' | 'macos' | 'linux' | 'universal';

function detectDesktopOS(): Exclude<ShortcutOS, 'universal'> {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = `${navigator.userAgent} ${(navigator as unknown as { platform?: string }).platform || ''}`.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux') && !ua.includes('android')) return 'linux';
  return 'windows';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildDesktopFile(os: ShortcutOS, appUrl: string): {
  filename: string;
  mimeType: string;
  content: string;
  label: string;
} {
  const safeUrl = appUrl.trim();
  const origin = safeUrl.replace(/\/$/, '');
  const logoUrl = `${origin}/logo-mark.png`;

  switch (os) {
    case 'windows':
      return {
        filename: 'LearnCo-Windows-App.url',
        mimeType: 'application/internet-shortcut',
        label: 'Windows Shortcut (.url)',
        content: `[InternetShortcut]\r\nURL=${safeUrl}\r\nIconIndex=0\r\n`,
      };
    case 'macos':
      return {
        filename: 'LearnCo-App.webloc',
        mimeType: 'application/xml',
        label: 'macOS Desktop Shortcut (.webloc)',
        content:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n` +
          `<plist version="1.0">\n` +
          `<dict>\n` +
          `\t<key>URL</key>\n` +
          `\t<string>${escapeXml(safeUrl)}</string>\n` +
          `</dict>\n` +
          `</plist>\n`,
      };
    case 'linux':
      return {
        filename: 'learnco-app.desktop',
        mimeType: 'application/x-desktop',
        label: 'Linux Desktop Entry (.desktop)',
        content:
          `[Desktop Entry]\n` +
          `Version=1.0\n` +
          `Type=Link\n` +
          `Name=LearnCo App\n` +
          `Comment=Launch LearnCo Adaptive Learning Studio\n` +
          `URL=${safeUrl}\n` +
          `Icon=web-browser\n`,
      };
    case 'universal':
    default: {
      const escapedUrl = escapeXml(safeUrl);
      const escapedLogo = escapeXml(logoUrl);
      const jsonUrl = JSON.stringify(safeUrl);
      return {
        filename: 'LearnCo-Desktop-App.html',
        mimeType: 'text/html;charset=utf-8',
        label: 'Universal Desktop Launcher (.html)',
        content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LearnCo — Desktop Launcher</title>
  <link rel="icon" href="${escapedLogo}" type="image/png" />
  <meta http-equiv="refresh" content="0; url=${escapedUrl}" />
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #1e1b33;
      color: #f1efff;
      padding: 24px;
    }
    .card {
      max-width: 440px;
      width: 100%;
      background: #2a2647;
      border: 1px solid #3d3861;
      border-radius: 28px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
    }
    .logo {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: #01000e;
      padding: 6px;
      margin: 0 auto 16px;
      display: block;
      object-fit: contain;
      border: 1px solid rgba(108, 92, 231, 0.5);
    }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0 0 20px; font-size: 14px; color: #b4b0d5; line-height: 1.5; }
    a.btn {
      display: inline-block;
      background: #6c5ce7;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 26px;
      border-radius: 999px;
    }
    a.btn:hover { background: #5b4bc4; }
    .url {
      margin-top: 14px;
      font-size: 11px;
      color: #8e8baf;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="${escapedLogo}" alt="LearnCo Logo" />
    <h1>Launching LearnCo…</h1>
    <p>Opening your live LearnCo workspace directly in the browser so Google Sign-In and cloud sync stay verified.</p>
    <a class="btn" href="${escapedUrl}">Open LearnCo Now</a>
    <div class="url">${escapedUrl}</div>
  </div>
  <script>
    window.location.replace(${jsonUrl});
  </script>
</body>
</html>
`,
      };
    }
  }
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [syncingPack, setSyncingPack] = useState(false);
  const [packMessage, setPackMessage] = useState<string | null>(null);

  const detectedOS = useMemo(() => detectDesktopOS(), []);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const swSupported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const appOriginUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://learn-co.ai.studio/';

  useEffect(() => {
    if (!showInstallGuide) return;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInstallGuide(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); triggerRef.current?.focus(); };
  }, [showInstallGuide]);

  const handleClick = async () => {
    setDownloadedFile(null);
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
    } catch { setCopiedUrl(false); }
  };

  const triggerDesktopDownload = (os: ShortcutOS) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const { filename, mimeType, content } = buildDesktopFile(os, appOriginUrl);
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setDownloadedFile(filename);
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        aria-label={isMobile ? 'Add LearnCo to mobile' : 'Install LearnCo'}
        className={
          compact
            ? 'w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-full bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shadow-xs transition cursor-pointer'
            : 'flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8577ED] hover:from-[#5B4BC4] hover:to-[#6C5CE7] text-white text-xs font-extrabold shadow-sm transition cursor-pointer'
        }
        title="Add LearnCo to your home screen or install it in your browser"
      >
        {isIOS ? (
          <Smartphone className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : (
          <Download className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
        {!compact && <span>{isMobile ? 'Add to mobile' : 'Install App'}</span>}
      </button>

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/75 dark:bg-[#100E1C]/85 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Install LearnCo"
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2A2647] p-6 shadow-2xl border border-[#E3DFF5] dark:border-[#3D3861] space-y-5 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#01000E] flex items-center justify-center border border-[#6C5CE7]/50 p-1 shrink-0 shadow-xs">
                  <img
                    src="/logo-mark.png"
                    alt="LearnCo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                    {isMobile ? 'Add LearnCo to your mobile' : 'Install LearnCo'}
                  </h3>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                    {isMobile ? 'Add the web app to your home screen' : 'Install the web app or save a desktop shortcut'}
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
                <span>{isInstallable ? 'Browser install available' : 'Use browser menu to install'}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2 text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                <Wifi className={`w-4 h-4 shrink-0 ${swSupported ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{swSupported ? 'Offline cache supported' : 'Offline app support unavailable'}</span>
              </div>
            </div>

            {/* Desktop shortcuts are not mobile app downloads. */}
            {!isMobile && <div className="p-4 rounded-3xl bg-gradient-to-br from-[#F0EDFA] to-[#E6F8F6] dark:from-[#1E1B33] dark:to-[#192838] border border-[#D4CEF4] dark:border-[#3D3861] space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop className="w-4 h-4 text-[#6C5CE7]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                    Save Clickable App File to Your Desktop
                  </h4>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] mt-0.5 leading-relaxed">
                    This shortcut opens LearnCo in your browser; it does not install an app or guarantee sign-in or sync.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => triggerDesktopDownload('universal')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <FileDown className="w-4 h-4 shrink-0" />
                  <span>Desktop File (.html)</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDesktopDownload(detectedOS)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-white dark:bg-[#2A2647] hover:bg-[#F7F5FF] dark:hover:bg-[#342F56] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#D4CEF4] dark:border-[#3D3861] text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0 text-[#00B8A9]" />
                  <span>
                    {detectedOS === 'windows'
                      ? 'Windows (.url)'
                      : detectedOS === 'macos'
                      ? 'macOS (.webloc)'
                      : 'Linux (.desktop)'}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                <span>Other OS shortcuts:</span>
                {(['windows', 'macos', 'linux'] as const).map((os) => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => triggerDesktopDownload(os)}
                    className="underline hover:text-[#6C5CE7] font-semibold capitalize cursor-pointer"
                  >
                    {os === 'macos' ? 'macOS' : os}
                  </button>
                ))}
              </div>

              {downloadedFile && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Downloaded <strong>{downloadedFile}</strong>. Move it from Downloads onto your Desktop and double-click anytime to open LearnCo.
                  </span>
                </div>
              )}
            </div>}

            {isInIframe && (
              <div className="p-3.5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Embedded Preview Detected</span>
                </p>
                <p className="leading-relaxed">
                    Open this page in a browser tab first. Installation may not be available inside an embedded preview.
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

            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">This adds a web app, not an APK or app-store download. Availability depends on your browser and a secure connection. Signing in and loading new content still require a connection.</p>
            {isIOS ? (
              <ol className="text-xs sm:text-sm text-[#2D2A4A] dark:text-[#F1EFFF] space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong>. Then open LearnCo from your home screen.
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
                {!isMobile && <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <p className="font-black text-[#6C5CE7] dark:text-[#8577ED]">
                    Browser Standalone App (Chrome / Edge / Brave)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Click the <strong>Install</strong> icon on the right side of the address bar, or open menu (&vellip;) &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install LearnCo</strong>.
                  </p>
                </div>}
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <p className="font-black text-[#00B8A9]">
                    Direct Web App on Android (No Play Store)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Tap the browser menu (&vellip;) &rarr; <strong>Add to Home screen</strong> &rarr; <strong>Install</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
              <button
                type="button"
                disabled={syncingPack}
                onClick={async () => {
                  setSyncingPack(true);
                  setPackMessage(null);
                  try {
                    const pack = await OfflineStorageManager.downloadOlympiadPack();
                    setPackMessage(`Cached ${pack.questions.length} problems (${pack.approxSizeKb} KB) on this device.`);
                  } catch {
                    setPackMessage('Could not cache the study pack. Please check storage and try again.');
                  } finally {
                    setSyncingPack(false);
                  }
                }}
                className="w-full min-h-[44px] rounded-xl bg-[#00B8A9] px-4 py-2 font-bold text-white disabled:opacity-60"
              >
                {syncingPack ? 'Caching study pack...' : 'Cache offline study pack'}
              </button>
              {packMessage && <p role="status">{packMessage}</p>}
              <p>Saved practice may need a connection and an active session to sync.</p>
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
