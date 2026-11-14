import React, { useMemo, useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import {
  Download,
  Smartphone,
  Monitor,
  X,
  ExternalLink,
  CheckCircle2,
  FileDown,
  Laptop,
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
  switch (os) {
    case 'windows':
      return {
        filename: 'LearnCo-App.url',
        mimeType: 'application/internet-shortcut',
        label: 'Windows Desktop Shortcut (.url)',
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
          `Name=Learn.co App\n` +
          `Comment=Launch Learn.co Adaptive Learning Studio\n` +
          `URL=${safeUrl}\n` +
          `Icon=web-browser\n`,
      };
    case 'universal':
    default: {
      const escapedUrl = escapeXml(safeUrl);
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
  <title>Learn.co — Desktop Launcher</title>
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
      border-radius: 20px;
      padding: 28px;
      text-align: center;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
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
      padding: 12px 22px;
      border-radius: 12px;
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
    <h1>Launching Learn.co…</h1>
    <p>Opening your live Learn.co workspace directly in the browser so Google Sign-In and cloud sync stay verified.</p>
    <a class="btn" href="${escapedUrl}">Open Learn.co Now</a>
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
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  const detectedOS = useMemo(() => detectDesktopOS(), []);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const appOriginUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://learn-co.ai.studio/';

  const handleClick = async () => {
    setDownloadedFile(null);
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowInstallGuide(true);
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

  if (isInstalled && compact) {
    return null;
  }

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
        title="Install Learn.co app or download Desktop launcher file (no Google Play Store required)"
      >
        {isIOS ? (
          <Smartphone className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : (
          <Download className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
        {!compact && <span>{isInstalled ? 'Desktop App' : 'Install / Desktop File'}</span>}
      </button>

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2A4A]/75 dark:bg-[#100E1C]/85 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Install Learn.co App or Save Desktop File"
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2A2647] p-6 shadow-2xl border border-[#E3DFF5] dark:border-[#3D3861] space-y-5 text-left">
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
                    Install Learn.co (No Play Store Needed)
                  </h3>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                    Download a Desktop launcher file or install directly from your browser
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

            {/* Save File Directly for Desktop */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0EDFA] to-[#E6F8F6] dark:from-[#1E1B33] dark:to-[#192838] border border-[#D4CEF4] dark:border-[#3D3861] space-y-3">
              <div className="flex items-start gap-2.5">
                <Laptop className="w-5 h-5 text-[#6C5CE7] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                    Save Clickable App File to Your Desktop
                  </h4>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] mt-0.5 leading-relaxed">
                    Download this file and place it on your Desktop. Double-clicking it opens Learn.co directly with Google Sign-In and cloud sync active—no Google Play Store required.
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
                  <span>Desktop Launcher (.html)</span>
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

              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#6B6890] dark:text-[#B4B0D5]">
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
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Downloaded <strong>{downloadedFile}</strong>. Move or drag it from your Downloads folder onto your Desktop, then double-click it anytime to launch Learn.co.
                  </span>
                </div>
              )}
            </div>

            {isInIframe && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Embedded Preview Detected</span>
                </p>
                <p className="leading-relaxed">
                  Browsers block one-click PWA install prompts inside embedded frames. Open the live app in its own browser tab, then click <strong>Install</strong> in the address bar.
                </p>
                <a
                  href={appOriginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open App in New Tab
                </a>
              </div>
            )}

            {isIOS ? (
              <ol className="text-xs sm:text-sm text-[#2D2A4A] dark:text-[#F1EFFF] space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> to launch Learn.co as a standalone app.
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-xs text-[#2D2A4A] dark:text-[#F1EFFF]">
                <div className="p-3 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <p className="font-black text-[#6C5CE7] dark:text-[#8577ED]">
                    Browser Standalone App (Chrome / Edge / Brave)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Click the <strong>Install</strong> icon on the right side of the address bar, or open menu (&vellip;) &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install Learn.co</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
                  <p className="font-black text-[#00B8A9]">
                    Direct Web App on Android (No Play Store)
                  </p>
                  <p className="text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                    Tap the browser menu (&vellip;) &rarr; <strong>Add to Home screen</strong> &rarr; <strong>Install</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Includes offline curriculum cache &amp; standalone desktop mode</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-bold text-sm transition shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
