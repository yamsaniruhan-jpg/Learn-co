import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  Server,
  UserCheck,
  Smartphone,
  Download,
  BookOpen,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  useNetworkStatus,
  OfflineStorageManager,
  OfflineOlympiadPack,
} from '../../utils/offlineStorage';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseConfigured, auth } from '../../services/firebaseClient';
import { syncClientToFirestore } from '../../services/clientFirestoreSync';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { FormattedMathText } from '../common/FormattedMathText';

interface OfflineSyncViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const OfflineSyncView: React.FC<OfflineSyncViewProps> = ({ onNavigateToTab }) => {
  const { isOnline, pendingOfflineCount, lastSyncedAt, triggerSync } = useNetworkStatus();
  const { user, profile, gamification, isAuthenticated } = useAuth();
  const [swStatus, setSwStatus] = useState<'ACTIVE' | 'INSTALLING' | 'UNSUPPORTED' | 'UNREGISTERED'>('UNREGISTERED');
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'CHECKING' | 'UNAVAILABLE'>('CHECKING');
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [olympiadPack, setOlympiadPack] = useState<OfflineOlympiadPack | null>(() =>
    OfflineStorageManager.getOlympiadPack()
  );
  const [isDownloadingPack, setIsDownloadingPack] = useState(false);
  const [showCheatSheets, setShowCheatSheets] = useState(false);
  const [packMessage, setPackMessage] = useState<string | null>(null);

  const checkEnvironmentStatus = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.active) setSwStatus('ACTIVE');
        else if (reg?.installing || reg?.waiting) setSwStatus('INSTALLING');
        else setSwStatus('UNREGISTERED');
      } catch {
        setSwStatus('UNREGISTERED');
      }
    } else {
      setSwStatus('UNSUPPORTED');
    }

    if (typeof caches !== 'undefined') {
      try {
        const keys = await caches.keys();
        setCacheCount(keys.length);
      } catch {
        setCacheCount(0);
      }
    }

    if (!isOnline) {
      setBackendStatus('UNAVAILABLE');
      return;
    }

    setBackendStatus('CHECKING');
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', { signal: controller.signal });
      window.clearTimeout(timer);
      setBackendStatus(res.ok ? 'ONLINE' : 'UNAVAILABLE');
    } catch {
      setBackendStatus('UNAVAILABLE');
    }
  }, [isOnline]);

  useEffect(() => {
    void checkEnvironmentStatus();
  }, [checkEnvironmentStatus]);

  useEffect(() => {
    const refreshPack = () => setOlympiadPack(OfflineStorageManager.getOlympiadPack());
    window.addEventListener('learnco_olympiad_pack_updated', refreshPack);
    return () => window.removeEventListener('learnco_olympiad_pack_updated', refreshPack);
  }, []);

  const handleDownloadOlympiadPack = async () => {
    setIsDownloadingPack(true);
    setPackMessage(null);
    try {
      const pack = await OfflineStorageManager.downloadOlympiadPack();
      setOlympiadPack(pack);
      setPackMessage(
        `Cached ${pack.questions.length} Olympiad problems and ${pack.cheatSheets.length} formula cheat sheets (${pack.approxSizeKb} KB) for offline study.`
      );
      await checkEnvironmentStatus();
    } catch {
      setPackMessage('Could not cache offline pack. Check browser storage permissions.');
    } finally {
      setIsDownloadingPack(false);
    }
  };

  const handleLaunchOfflinePack = () => {
    const queued = OfflineStorageManager.queueOfflinePackLaunch();
    if (queued) {
      onNavigateToTab('practice');
    }
  };

  const handleClearPack = () => {
    OfflineStorageManager.clearOlympiadPack();
    setOlympiadPack(null);
    setShowCheatSheets(false);
    setPackMessage('Offline Olympiad Pack cleared from device storage.');
    void checkEnvironmentStatus();
  };

  const handleForceSync = async () => {
    if (!isOnline) {
      setSyncNotice('Currently offline — queued attempts will sync automatically on reconnection.');
      return;
    }
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const synced = await triggerSync();
      let cloudSynced = false;
      if (isAuthenticated && user) {
        try {
          await syncClientToFirestore(user, profile, gamification);
          cloudSynced = Boolean(isFirebaseConfigured() && auth?.currentUser);
        } catch {
          cloudSynced = false;
        }
      }
      if (synced > 0 || cloudSynced || (pendingOfflineCount === 0 && backendStatus === 'ONLINE')) {
        OfflineStorageManager.markCloudSynced();
      }
      await checkEnvironmentStatus();

      if (synced > 0) {
        setSyncNotice(
          `Synced ${synced} queued attempt${synced === 1 ? '' : 's'} to server${
            cloudSynced ? ' and updated Firestore cloud profile.' : '.'
          }`
        );
      } else if (pendingOfflineCount === 0) {
        setSyncNotice(
          cloudSynced
            ? 'All practice attempts and Firestore cloud records are synchronized.'
            : isAuthenticated
            ? 'All local practice attempts are synchronized with the server.'
            : 'Offline pack verified locally. Sign in to synchronize XP and progress across devices.'
        );
      } else {
        setSyncNotice(
          'No attempts synced. Check your connection and sign in to the account that created them. Older unassigned entries are retained.'
        );
      }
    } catch {
      setSyncNotice('Sync could not finish. Your device storage may be unavailable; please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const firebaseConfigured = isFirebaseConfigured();
  const firebaseUserConnected = Boolean(auth?.currentUser?.email);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-[#2D2A4A] via-[#262340] to-[#3B3278] text-white p-6 sm:p-8 shadow-xl border border-[#3D3861] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA Service Worker &middot; Cloud Sync &middot; Offline Curriculum Cache</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            PWA Online &amp; Offline Synchronization
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time health check across your browser network, API server session, Firestore cloud profile, service worker cache, and queued practice attempts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <PWAInstallButton />
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigateToTab('practice')}
            className="bg-[#6C5CE7] hover:bg-[#5A4BD1] text-white font-bold"
          >
            Practice Arena
          </Button>
        </div>
      </div>

      {/* Offline Olympiad Study Pack */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Flight &amp; Commute Ready &middot; IPhO &middot; IChO &middot; IBHO &middot; IJSO &middot; ICT
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Offline Olympiad Study Pack
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Cache curated Olympiad question sets and essential formula cheat sheets locally on your device so you can practice and review solutions without an active internet connection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isDownloadingPack}
              onClick={() => void handleDownloadOlympiadPack()}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloadingPack
                  ? 'Downloading Pack...'
                  : olympiadPack
                  ? 'Refresh Olympiad Pack'
                  : 'Download Olympiad Pack for Offline Study'}
              </span>
            </button>

            {olympiadPack && (
              <>
                <button
                  type="button"
                  onClick={handleLaunchOfflinePack}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Practice Offline Pack</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearPack}
                  aria-label="Clear offline Olympiad pack"
                  className="min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {packMessage && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-800 dark:text-indigo-200">
            {packMessage}
          </div>
        )}

        {olympiadPack && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Cached Problems</div>
                <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {olympiadPack.questions.length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Formula Sheets</div>
                <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {olympiadPack.cheatSheets.length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Device Footprint</div>
                <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {olympiadPack.approxSizeKb} KB
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Last Saved</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 tabular-nums">
                  {new Date(olympiadPack.downloadedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium tabular-nums">
              Track breakdown: IPhO ({olympiadPack.trackCounts.IPhO}) &middot; IChO ({olympiadPack.trackCounts.IChO}) &middot; IBHO ({olympiadPack.trackCounts.IBHO}) &middot; IJSO ({olympiadPack.trackCounts.IJSO}) &middot; ICT ({olympiadPack.trackCounts.ICT})
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowCheatSheets((prev) => !prev)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>{showCheatSheets ? 'Hide Offline Formula Cheat Sheets' : 'View Cached Olympiad Formula Cheat Sheets'}</span>
                {showCheatSheets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCheatSheets && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {olympiadPack.cheatSheets.map((sheet) => (
                    <div
                      key={sheet.track}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {sheet.track} &middot; {sheet.title}
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {sheet.keyFormulas.map((kf, idx) => (
                          <li key={idx} className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{kf.label}</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              <FormattedMathText text={kf.formula} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Network Connectivity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Network State</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isOnline
                ? 'Browser reports an active network connection for live sync.'
                : 'Offline mode active; eligible practice attempts queue locally.'}
            </p>
          </div>

          {/* 2. API & Auth Session */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-500" />
                <span>API &amp; Session</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  backendStatus === 'ONLINE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {backendStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAuthenticated
                ? `Signed in as ${user?.email || profile?.email || 'Verified Scholar'}.`
                : 'Guest session — sign in to persist server XP and cross-device progress.'}
            </p>
          </div>

          {/* 3. Firestore Cloud Sync */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-cyan-500" />
                <span>Firestore Cloud Sync</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  firebaseConfigured && firebaseUserConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : firebaseConfigured
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {firebaseConfigured && firebaseUserConnected
                  ? 'SYNCED'
                  : firebaseConfigured
                  ? 'READY'
                  : 'LOCAL DB'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {firebaseConfigured && firebaseUserConnected
                ? 'Firebase Auth + Firestore cloud synchronization active for this scholar.'
                : firebaseConfigured
                ? 'Firebase project configured; backend SQL/JSON database remains authoritative.'
                : 'Operating via Learn.co backend API persistence.'}
            </p>
          </div>

          {/* 4. Service Worker Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Service Worker</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  swStatus === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : swStatus === 'INSTALLING'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {swStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {swStatus === 'ACTIVE'
                ? `Active (${cacheCount} cache store${cacheCount === 1 ? '' : 's'}) ready for Home Screen launch.`
                : 'Service worker activates automatically in supported HTTPS / standalone app browsers.'}
            </p>
          </div>

          {/* 5. Pending Sync Queue */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Pending Sync Queue</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A598FF] font-bold text-[10px] tabular-nums">
                {pendingOfflineCount} QUEUED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pendingOfflineCount === 0
                ? `No pending offline attempts on this device.${
                    lastSyncedAt ? ` Last synced at ${new Date(lastSyncedAt).toLocaleTimeString()}.` : ''
                  }`
                : `${pendingOfflineCount} offline attempt${
                    pendingOfflineCount === 1 ? '' : 's'
                  } queued on this device awaiting synchronization.`}
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <span role="status" aria-live="polite" className="text-xs text-slate-500 dark:text-slate-400">
            {syncNotice ||
              'The workspace automatically syncs eligible attempts when online or reconnecting.'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={isSyncing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
          >
            {isSyncing ? 'Syncing...' : 'Force Sync Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

