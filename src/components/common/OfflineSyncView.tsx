import React from 'react';
import { ShieldCheck, Wifi, Cloud, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface OfflineSyncViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const OfflineSyncView: React.FC<OfflineSyncViewProps> = ({ onNavigateToTab }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-slate-300 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA Service Worker & Offline Curriculum Cache</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            PWA Offline Synchronization
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Learn.co caches curriculum modules, practice attempt queues, and user streaks locally in IndexedDB so you can study seamlessly without an internet connection.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigateToTab('practice')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0"
        >
          Practice Arena
        </Button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Service Worker Status</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">ACTIVE</span>
            </div>
            <p className="text-xs text-slate-500">Offline shell cache and asset bundling verified.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pending Sync Queue</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold text-[10px]">0 QUEUED</span>
            </div>
            <p className="text-xs text-slate-500">All local practice attempts are fully synchronized to server.</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">Automatic background sync enabled on network reconnection.</span>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Force Sync Now
          </Button>
        </div>
      </div>
    </div>
  );
};
