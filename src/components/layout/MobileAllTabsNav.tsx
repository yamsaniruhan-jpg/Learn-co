import React, { useState } from 'react';
import {
  Menu,
  X,
  ChevronRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineStorageManager } from '../../utils/offlineStorage';
import { ALL_APP_FEATURES, CATEGORY_ORDER, groupNavFeatures, NavFeature } from '../../utils/navigationFeatures';

export type { NavFeature };
export { ALL_APP_FEATURES, CATEGORY_ORDER, groupNavFeatures };

export interface MobileAllTabsNavProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  dailyAllowanceRemaining: number;
}

export const MobileAllTabsNav: React.FC<MobileAllTabsNavProps> = ({
  activeTab,
  setActiveTab,
  dailyAllowanceRemaining,
}) => {
  const { user, profile } = useAuth();
  const [isOpenAllDrawer, setIsOpenAllDrawer] = useState(false);
  const [mobileSyncing, setMobileSyncing] = useState(false);
  const [mobilePackStatus, setMobilePackStatus] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin' || profile?.role === 'admin';

  const visibleFeatures = ALL_APP_FEATURES.filter((feat) => feat.id !== 'admin' || isAdmin);
  const groupedFeatures = groupNavFeatures(visibleFeatures);

  const primaryBottomTabs = [
    visibleFeatures.find((f) => f.id === 'learn')!,
    visibleFeatures.find((f) => f.id === 'practice')!,
    visibleFeatures.find((f) => f.id === 'copilot')!,
    visibleFeatures.find((f) => f.id === 'create')!,
    visibleFeatures.find((f) => f.id === 'planner')!,
    visibleFeatures.find((f) => f.id === 'profile')!,
  ];

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpenAllDrawer(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar with All-Features Drawer Trigger */}
      <nav aria-label="Mobile feature navigation" className="md:hidden border-t border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around sticky bottom-0 z-40 shadow-[0_-2px_8px_rgba(45,42,74,0.06)]">
        {primaryBottomTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`relative flex flex-1 min-w-0 flex-col items-center justify-center py-1.5 px-0 rounded-xl text-[10px] font-bold transition-colors min-h-[44px] cursor-pointer ${
                isActive
                  ? 'text-[#6C5CE7] dark:text-[#8577ED] font-black'
                  : 'text-[#6B6890] dark:text-[#B4B0D5]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-full px-0.5">{item.shortLabel}</span>
              {item.id === 'practice' && dailyAllowanceRemaining > 0 && (
                <span className="absolute top-0.5 right-0.5 text-[9px] px-1 rounded-full bg-[#6C5CE7] text-white font-black tabular-nums">
                  {dailyAllowanceRemaining}
                </span>
              )}
            </button>
          );
        })}

        {/* The 'All Tabs & Features' Trigger */}
        <button
          onClick={() => setIsOpenAllDrawer(true)}
          className={`flex flex-1 min-w-0 flex-col items-center justify-center py-1.5 px-0 rounded-xl text-[10px] font-bold transition-colors min-h-[44px] cursor-pointer ${
            isOpenAllDrawer
              ? 'text-[#6C5CE7] dark:text-[#8577ED] font-black'
              : 'text-[#6B6890] dark:text-[#B4B0D5]'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>All Tabs</span>
        </button>
      </nav>

      {/* Full Mobile Navigation Drawer Modal */}
      {isOpenAllDrawer && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 animate-in fade-in duration-200">
          <div
            className="flex-1"
            onClick={() => setIsOpenAllDrawer(false)}
            aria-label="Close modal overlay"
          />

          <div className="bg-[#FFFFFF] dark:bg-[#2A2647] rounded-t-3xl border-t border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_-8px_30px_rgba(45,42,74,0.2)] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display flex items-center gap-2">
                  <Menu className="w-5 h-5 text-[#6C5CE7] dark:text-[#8577ED] shrink-0" />
                  <span className="truncate">All Learn.co Tabs &amp; Features</span>
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-medium truncate">
                  Switch instantly to any area of the STEM platform
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <PWAInstallButton />
                <button
                  onClick={() => setIsOpenAllDrawer(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] cursor-pointer"
                  aria-label="Close all tabs drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Mobile Install & Offline Pack Sync Strip */}
            <div className="px-4 py-3 bg-[#F7F5FF] dark:bg-[#1E1B33] border-b border-[#E3DFF5] dark:border-[#3D3861] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <button
                  type="button"
                  disabled={mobileSyncing}
                  onClick={async () => {
                    setMobileSyncing(true);
                    try {
                      const pack = await OfflineStorageManager.downloadOlympiadPack();
                      const synced = await OfflineStorageManager.syncPendingAttemptsToServer();
                      setMobilePackStatus(`${pack.questions.length} cached${synced > 0 ? ` • ${synced} synced` : ''}`);
                    } finally {
                      setMobileSyncing(false);
                    }
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#00B8A9] hover:bg-[#009b8e] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {mobileSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{mobileSyncing ? 'Syncing...' : mobilePackStatus || 'Offline Pack & Sync'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('offline-sync')}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] text-xs font-bold cursor-pointer"
                >
                  Sync Center
                </button>
              </div>
            </div>

            {/* Feature sections retain the role-filtered list. */}
            <div className="p-4 overflow-y-auto space-y-5">
              {groupedFeatures.map(({ category, features }) => (
                <section key={category}>
                  <h3 className="px-1 mb-2 text-[11px] font-black uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5]">{category} <span>{features.length}</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((feat) => {
                  const Icon = feat.icon;
                  const isActive = activeTab === feat.id;
                  return (
                    <button
                      key={`drawer-${feat.id}`}
                      onClick={() => handleSelect(feat.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm font-bold truncate ${
                              isActive
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {feat.label}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {feat.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {feat.description}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-2 ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 opacity-40'
                        }`}
                      />
                    </button>
                  );
                })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
