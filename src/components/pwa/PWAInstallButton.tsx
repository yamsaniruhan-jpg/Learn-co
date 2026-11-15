import React, { useMemo, useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
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
  Share,
  PlusSquare,
  MoreVertical,
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
        label: 'macOS Shortcut (.webloc)',
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
        label: 'Linux Launcher (.desktop)',
        content:
          `[Desktop Entry]\n` +
          `Version=1.0\n` +
          `Type=Link\n` +
          `Name=LearnCo App\n` +
          `Comment=Launch LearnCo Adaptive STEM Studio\n` +
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
        label: 'Universal Desktop App (.html)',
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
  const { isInstallable, isInstalled, isIOS, isAndroid, isMobile, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const detectedOS = useMemo(() => detectDesktopOS(), []);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const appOriginUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://learn-co.ai.studio/';

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

  const handleClick = async () => {
    setDownloadedFile(null);
    if (isInstallable) {
      try {
        const accepted = await install();
        if (accepted) return;
      } catch {
        // Fall through to dedicated mobile / desktop instructions modal
      }
    }
    if (!isMobile) {
      // Desktop fallback: download OS launcher file and open guide
      triggerDesktopDownload(detectedOS);
    }
    setShowInstallGuide(true);
  };

  const handleCopyUrl = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(appOriginUrl);
    setCopiedUrl(true);
    window.setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Hide compact button only when already launched in standalone home-screen mode
  if (isInstalled && compact) {
    return null;
  }

  const buttonLabel = isInstalled
    ? isMobile
      ? 'Home Screen App'
      : 'Desktop App'
    : isMobile
    ? 'Add to Home Screen'
    : 'Install App';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 min-h-[40px] rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap'
            : 'flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0'
        }
        title={
          isMobile
            ? 'Add LearnCo to your phone Home Screen as an Android/iOS app'
            : 'Install LearnCo Desktop App or save OS launcher file'
        }
      >
        {isMobile ? (
          <Smartphone className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        ) : (
          <Download className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        )}
        {!compact && <span>{buttonLabel}</span>}
      </button>

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/75 dark:bg-[#100E1C]/85 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Install LearnCo App"
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
                    {isMobile ? 'Add LearnCo to Home Screen' : 'Install LearnCo Desktop App'}
                  </h3>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                    {isMobile
                      ? 'Runs full-screen on Android & iOS without Play Store'
                      : 'Standalone Chromium app or desktop shortcut launcher'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6B6890] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer shrink-0"
                aria-label="Close install instructions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Readiness Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2 text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    isInstallable || isInstalled ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                />
                <span>{isInstalled ? 'Installed App' : isInstallable ? '1-Click Ready' : 'Ready via Menu'}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2 text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                <Wifi className={`w-4 h-4 shrink-0 ${swSupported ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{swSupported ? 'Offline Cache Ready' : 'Online Sync Ready'}</span>
              </div>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await install();
                  if (ok) setShowInstallGuide(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isMobile ? 'Add to Home Screen Now' : 'Install Standalone Desktop App'}</span>
              </button>
            )}

            {isInIframe && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Open Outside Preview Frame to Install</span>
                </p>
                <p className="leading-relaxed">
                  Mobile and desktop browsers only trigger <strong>Add to Home Screen</strong> when LearnCo is opened in its own browser tab.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={appOriginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open App Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#2A2647] border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-xs cursor-pointer transition"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Link Copied' : 'Copy App Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Instructions */}
            {isIOS ? (
              <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-3">
                <div className="font-black text-xs text-[#6C5CE7] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone &amp; iPad Safari (Home Screen App)</span>
                </div>
                <ol className="text-xs text-[#2D2A4A] dark:text-[#F1EFFF] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                    <span>
                      1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                    <span>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      3. Tap <strong>Add</strong> — LearnCo installs directly onto your home screen.
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1.5">
                  <p className="font-black text-[#00B8A9] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Android Phone App ({isAndroid ? 'Detected' : 'Chrome / Edge'})</span>
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed flex items-start gap-1.5">
                    <MoreVertical className="w-4 h-4 shrink-0 mt-0.5 text-[#00B8A9]" />
                    <span>
                      Open browser menu &rarr; <strong>Add to Home screen</strong> &rarr; <strong>Install</strong> to place the LearnCo Android WebAPK icon on your home screen.
                    </span>
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <p className="font-black text-[#6C5CE7] dark:text-[#8577ED]">
                    Desktop Browser App (Chrome / Edge / Brave)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Click the <strong>Install</strong> icon in the address bar or open browser menu &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install LearnCo</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Desktop File Download Section */}
            <div className="p-4 rounded-2xl bg-[#F0EDFA] dark:bg-[#1E1B33] border border-[#D4CEF4] dark:border-[#3D3861] space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop className="w-4 h-4 text-[#6C5CE7]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                    Download Desktop App Launcher File
                  </h4>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] mt-0.5 leading-relaxed">
                    Save an offline shortcut file directly to your Windows, macOS, or Linux desktop.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => triggerDesktopDownload('universal')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <FileDown className="w-4 h-4 shrink-0" />
                  <span>Universal (.html)</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDesktopDownload(detectedOS)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-[#2A2647] hover:bg-[#F7F5FF] dark:hover:bg-[#342F56] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#D4CEF4] dark:border-[#3D3861] text-xs font-bold transition cursor-pointer"
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

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                <span>All Desktop formats:</span>
                {(['windows', 'macos', 'linux'] as const).map((os) => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => triggerDesktopDownload(os)}
                    className="underline hover:text-[#6C5CE7] font-semibold capitalize cursor-pointer min-h-[24px]"
                  >
                    {os === 'macos' ? 'macOS' : os}
                  </button>
                ))}
              </div>

              {downloadedFile && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Downloaded <strong>{downloadedFile}</strong>. Move it onto your Desktop and double-click anytime to launch LearnCo.
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#2D2A4A] dark:bg-[#6C5CE7] hover:opacity-95 text-white font-bold text-sm transition shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
