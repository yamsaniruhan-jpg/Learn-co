import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNetworkStatus } from '../../utils/offlineStorage';

interface OfflineSyncViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const OfflineSyncView: React.FC<OfflineSyncViewProps> = ({ onNavigateToTab }) => {
  const { isOnline, pendingOfflineCount, triggerSync } = useNetworkStatus();
  const [swStatus, setSwStatus] = useState<'ACTIVE' | 'UNSUPPORTED' | 'UNREGISTERED'>('UNREGISTERED');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      setSwStatus('UNSUPPORTED');
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        setSwStatus(reg?.active ? 'ACTIVE' : 'UNREGISTERED');
      })
      .catch(() => setSwStatus('UNREGISTERED'));
  }, []);

  const handleForceSync = async () => {
    if (!isOnline) {
      setSyncNotice('Currently offline — queued attempts will sync automatically on reconnection.');
      return;
    }
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const synced = await triggerSync();
      setSyncNotice(
        synced > 0
          ? `Synced ${synced} queued attempt${synced === 1 ? '' : 's'} to server.`
          : pendingOfflineCount === 0
          ? 'All local practice attempts are already synchronized.'
          : 'Sign in required to push queued attempts to your account.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-[#2D2A4A] via-[#262340] to-[#3B3278] text-white p-6 sm:p-8 shadow-xl border border-[#3D3861] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-slate-200 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA Service Worker & Offline Curriculum Cache</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            PWA Offline Synchronization
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Learn.co caches curriculum modules and queues offline practice attempts locally so you can study seamlessly and synchronize upon reconnection.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigateToTab('practice')}
          className="bg-[#6C5CE7] hover:bg-[#5A4BD1] text-white font-bold shrink-0"
        >
          Practice Arena
        </Button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {isOnline ? 'Connected to Learn.co backend APIs.' : 'Offline mode active; attempts are queued locally.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Service Worker Status</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  swStatus === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {swStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {swStatus === 'ACTIVE'
                ? 'Offline shell cache and asset bundling verified.'
                : 'Service worker activates automatically in production PWA contexts.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pending Sync Queue</span>
              <span className="px-2 py-0.5 rounded bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A598FF] font-bold text-[10px]">
                {pendingOfflineCount} QUEUED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pendingOfflineCount === 0
                ? 'All local practice attempts are synchronized to server.'
                : `${pendingOfflineCount} offline attempt${pendingOfflineCount === 1 ? '' : 's'} awaiting synchronization.`}
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {syncNotice || 'Automatic background sync runs on network reconnection.'}
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

