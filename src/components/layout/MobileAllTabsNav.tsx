import React, { useState } from 'react';
import {
  Menu,
  X,
  ChevronRight,
  Download,
  RefreshCw,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Target,
  Bot,
  Calendar,
  Clock,
  Compass,
  Trophy,
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
    { id: 'dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'learn', shortLabel: 'Learn', icon: BookOpen },
    { id: 'practice', shortLabel: 'Practice', icon: Target },
    { id: 'copilot', shortLabel: 'Doubts', icon: Bot },
    { id: 'create', shortLabel: 'Create', icon: Sparkles },
    { id: 'planner', shortLabel: 'Plan', icon: Calendar },
    { id: 'focus', shortLabel: 'Focus', icon: Clock },
    { id: 'mentor', shortLabel: 'Mentor', icon: Compass },
    { id: 'leaderboard', shortLabel: 'Ranks', icon: Trophy },
  ];

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpenAllDrawer(false);
  };

  return (
    <>
      {/* Mobile Bottom Tab Bar (1-word calm icon labels, 44px+ tap targets) */}
      <nav
        aria-label="Mobile feature navigation"
        className="md:hidden border-t border-[#E3DFF5] dark:border-[#232329] bg-[#FFFFFF] dark:bg-[#111114] px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sticky bottom-0 z-40"
      >
        {primaryBottomTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex shrink-0 min-w-[58px] min-h-[46px] flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6C5CE7] dark:focus-visible:outline-[#CCFF00] ${
                isActive
                  ? 'bg-[#F0EDFA] dark:bg-[#16161C] text-[#6C5CE7] dark:text-[#CCFF00] font-black border border-[#E3DFF5] dark:border-[#CCFF00]/30'
                  : 'text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6]'
              }`}
            >
              <Icon className="w-4.5 h-4.5 mb-0.5" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
              {item.id === 'practice' && dailyAllowanceRemaining > 0 && (
                <span className="sr-only">{dailyAllowanceRemaining} daily quota remaining</span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOpenAllDrawer(true)}
          aria-expanded={isOpenAllDrawer}
          className={`flex shrink-0 min-w-[58px] min-h-[46px] flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
            isOpenAllDrawer
              ? 'bg-[#F0EDFA] dark:bg-[#16161C] text-[#6C5CE7] dark:text-[#CCFF00] font-black'
              : 'text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6]'
          }`}
        >
          <Menu className="w-4.5 h-4.5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Full Mobile Navigation Drawer Modal */}
      {isOpenAllDrawer && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-black/80 animate-in fade-in duration-200">
          <div
            className="flex-1"
            onClick={() => setIsOpenAllDrawer(false)}
            aria-label="Close modal overlay"
          />

          <div className="bg-[#FFFFFF] dark:bg-[#111114] rounded-t-2xl border-t border-[#E3DFF5] dark:border-[#232329] shadow-[0_-8px_30px_rgba(0,0,0,0.4)] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#E3DFF5] dark:border-[#232329] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F4F4F6] font-display flex items-center gap-2">
                  <Menu className="w-5 h-5 text-[#6C5CE7] dark:text-[#CCFF00] shrink-0" />
                  <span className="truncate">All LearnCo Tabs &amp; Features</span>
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#9E9EA9] font-medium truncate">
                  Switch instantly to any area of the STEM platform
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <PWAInstallButton />
                <button
                  onClick={() => setIsOpenAllDrawer(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] text-[#6B6890] dark:text-[#9E9EA9] cursor-pointer"
                  aria-label="Close all tabs drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Mobile Install & Offline Pack Sync Strip */}
            <div className="px-4 py-3 bg-[#F7F5FF] dark:bg-[#09090B] border-b border-[#E3DFF5] dark:border-[#232329] flex flex-wrap items-center justify-between gap-2">
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
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-[#00B8A9] hover:bg-[#009b8e] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {mobileSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{mobileSyncing ? 'Syncing...' : mobilePackStatus || 'Offline Pack & Sync'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('offline-sync')}
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] text-[#2D2A4A] dark:text-[#F4F4F6] text-xs font-bold cursor-pointer"
                >
                  Sync Center
                </button>
              </div>
            </div>

            {/* Feature sections retain the role-filtered list. */}
            <div className="p-4 overflow-y-auto space-y-5">
              {groupedFeatures.map(({ category, features }) => (
                <section key={category}>
                  <h3 className="px-1 mb-2 micro text-[#6B6890] dark:text-[#9E9EA9]">{category} <span>{features.length}</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((feat) => {
                  const Icon = feat.icon;
                  const isActive = activeTab === feat.id;
                  return (
                    <button
                      key={`drawer-${feat.id}`}
                      onClick={() => handleSelect(feat.id)}
                      className={`min-h-[44px] flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#6C5CE7]/10 dark:bg-[#CCFF00]/12 border border-[#6C5CE7]/35 dark:border-[#CCFF00]/45'
                          : 'bg-[#F7F5FF] dark:bg-[#09090B] hover:bg-[#EDE9FE] dark:hover:bg-[#16161C] border border-[#E3DFF5]/60 dark:border-[#232329]'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          isActive
                            ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]'
                            : 'bg-[#FFFFFF] dark:bg-[#111114] text-[#2D2A4A] dark:text-[#F4F4F6] border border-[#E3DFF5] dark:border-[#232329]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm font-bold truncate ${
                              isActive
                                ? 'text-[#6C5CE7] dark:text-[#CCFF00]'
                                : 'text-[#2D2A4A] dark:text-[#F4F4F6]'
                            }`}
                          >
                            {feat.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#6B6890] dark:text-[#9E9EA9] shrink-0">
                            {feat.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6890] dark:text-[#9E9EA9] line-clamp-1 mt-0.5">
                          {feat.description}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-2 ${
                          isActive
                            ? 'text-[#6C5CE7] dark:text-[#CCFF00]'
                            : 'text-[#6B6890] dark:text-[#71717A] opacity-60'
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
