import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../utils/offlineStorage';

interface OfflineIndicatorProps {
  onOpenOfflineSync?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenOfflineSync }) => {
  const { isOnline, pendingOfflineCount } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <button
      type="button"
      onClick={onOpenOfflineSync}
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg border border-amber-300 transition cursor-pointer"
    >
      <span className="h-2 w-2 rounded-full bg-slate-950" />
      <WifiOff className="w-3.5 h-3.5" />
      <span>
        Offline Mode — Cached study data active
        {pendingOfflineCount > 0 ? ` (${pendingOfflineCount} queued)` : ''}
      </span>
    </button>
  );
};
