import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Zap,
  Flame,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Sparkles,
  PanelRight,
  LogIn,
  ShieldCheck,
  Maximize2,
  Minimize2,
  WifiOff,
  Clock,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../ui/BrandLogo';
import { Avatar } from '../ui/Avatar';
import { XPIndicator, StreakIndicator } from '../ui/GamificationIndicators';
import { DAILY_PRACTICE_LIMIT } from '../../types/auth';
import { useNetworkStatus } from '../../utils/offlineStorage';
import { AIUsageIndicator } from '../common/AIUsageIndicator';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  onToggleContextPanel?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenAuthModal: () => void;
  onOpenFlashCheck?: () => void;
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount = 2,
  onToggleContextPanel,
  isDarkMode,
  onToggleTheme,
  onOpenProfile,
  onOpenAuthModal,
  onOpenFlashCheck,
  onToggleZenMode,
  isZenMode = false,
}) => {
  const { user, profile, gamification, isAuthenticated, signOut } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const solvedToday = gamification?.dailyQuestionsSolvedToday ?? 0;
  const allowanceRemaining = Math.max(0, DAILY_PRACTICE_LIMIT - solvedToday);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFFFFF] dark:bg-[#111114] border-b border-[#E3DFF5] dark:border-[#232329] transition-colors">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            aria-label="Go to dashboard"
            className="cursor-pointer hover:opacity-90 transition-opacity rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7] dark:focus-visible:outline-[#CCFF00]"
          >
            <BrandLogo size="sm" className="sm:hidden" />
            <BrandLogo size="md" className="hidden sm:flex" />
          </button>

          {/* Quick Command Palette Button on Desktop */}
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/60 text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6] transition-all text-xs w-52 lg:w-64 justify-between cursor-pointer min-h-[42px]"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-[#6B6890] dark:text-[#71717A] shrink-0" />
              <span className="truncate">Search modules...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FFFFFF] dark:bg-[#16161C] rounded border border-[#E3DFF5] dark:border-[#232329] text-[#2D2A4A] dark:text-[#F4F4F6]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Single-row compact mobile controls */}
        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-1 sm:gap-2">
          {/* Mobile Search Icon Trigger */}
          <button
            onClick={onOpenSearch}
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-[#6B6890] dark:text-[#9E9EA9] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] shrink-0 cursor-pointer"
            aria-label="Open Search"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Offline Mode Indicator if disconnected */}
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFB84D] text-[#09090B] border border-[#e09d3b] text-xs font-black"
              title="Offline Mode: studying from local cached curriculum and offline attempts"
            >
              <WifiOff className="w-3.5 h-3.5 text-[#09090B]" />
              <span className="hidden sm:inline">Offline Mode</span>
            </div>
          )}

          {/* Flash Check Quick Trigger Button */}
          {onOpenFlashCheck && (
            <button
              onClick={onOpenFlashCheck}
              className="hidden 2xl:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#16161C] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1E26] border border-[#FFB84D]/70 text-[#2D2A4A] dark:text-[#F4F4F6] text-xs font-bold transition-all cursor-pointer min-h-[40px]"
              title="Start 60-second Spaced Retention Flash Check (+15 XP)"
            >
              <Zap className="w-4 h-4 fill-[#FFB84D] text-[#FFB84D]" />
              <span>Flash Check</span>
            </button>
          )}

          {/* Quick Zen Focus Timer Button */}
          <button
            onClick={() => setActiveTab('focus')}
            className={`hidden 2xl:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'focus'
                ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]'
                : 'bg-[#FFFFFF] dark:bg-[#16161C] text-[#2D2A4A] dark:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1E26] border border-[#E3DFF5] dark:border-[#232329]'
            }`}
            title="Open Zen Focus Timer Workspace"
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'focus' ? '' : 'text-[#6C5CE7] dark:text-[#CCFF00]'}`} />
            <span>Zen Focus</span>
          </button>

          {/* Quick User Guide Button */}
          <button
            onClick={() => setActiveTab('user-guide')}
            className={`hidden 2xl:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'user-guide' || activeTab === 'guide'
                ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]'
                : 'bg-[#FFFFFF] dark:bg-[#16161C] text-[#2D2A4A] dark:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1E26] border border-[#E3DFF5] dark:border-[#232329]'
            }`}
            title="Open Platform User Guide & Manual"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#00B8A9]" />
            <span>User Guide</span>
          </button>

          {/* Zen Focus Canvas Toggle */}
          {onToggleZenMode && (
            <button
              onClick={onToggleZenMode}
              className="hidden sm:flex p-2 min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#6C5CE7] dark:hover:text-[#CCFF00] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] transition-colors cursor-pointer"
              title={isZenMode ? "Exit Zen Mode" : "Enter Distraction-Free Zen Study Canvas (Esc to exit)"}
              aria-label="Toggle Zen Focus Mode"
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Daily Allowance Quota Readout */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0EDFA] dark:bg-[#16161C] text-[#2D2A4A] dark:text-[#F4F4F6] text-xs font-bold border border-[#E3DFF5] dark:border-[#232329] min-h-[38px] tabular-nums font-mono">
            <span className="text-[10px] uppercase tracking-wider text-[#6B6890] dark:text-[#9E9EA9]">Quota</span>
            <span className="text-[#6C5CE7] dark:text-[#CCFF00] font-black">
              {allowanceRemaining}/{DAILY_PRACTICE_LIMIT}
            </span>
          </div>

          {/* AI Hourly Quota Indicator */}
          <div className="hidden lg:block">
            <AIUsageIndicator userTier={user?.subscription} />
          </div>

          {/* Streak Flame */}
          <div className="sm:hidden shrink-0">
            <StreakIndicator streak={gamification?.currentStreak ?? 0} size="sm" className="!px-2 !py-1 !text-[11px]" />
          </div>
          <div className="hidden sm:block">
            <StreakIndicator streak={gamification?.currentStreak ?? 0} size="sm" />
          </div>

          {/* XP Indicator */}
          <div className="hidden sm:block">
            <XPIndicator xp={gamification?.xp ?? 0} size="sm" />
          </div>

          {/* Direct Home Screen App Install Action */}
          <div className="sm:hidden shrink-0">
            <PWAInstallButton compact compactLabel="App" />
          </div>
          <div className="hidden sm:block shrink-0">
            <PWAInstallButton />
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative h-11 w-11 flex items-center justify-center rounded-lg text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] transition-colors cursor-pointer shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#6C5CE7] dark:bg-[#CCFF00] ring-2 ring-[#FFFFFF] dark:ring-[#111114]" />
            )}
          </button>

          {/* Theme Toggle (Dark/Light) */}
          <button
            onClick={onToggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] transition-colors cursor-pointer shrink-0"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FFB84D]" />
            ) : (
              <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#6B6890]" />
            )}
          </button>

          {/* Toggle Right Context Companion Panel (Desktop) */}
          {onToggleContextPanel && (
            <button
              onClick={onToggleContextPanel}
              className="hidden lg:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#6C5CE7] dark:hover:text-[#CCFF00] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] transition-colors cursor-pointer"
              title="Toggle Study Companion"
            >
              <PanelRight className="w-5 h-5" />
            </button>
          )}

          {/* User Profile Avatar with Dropdown or Sign In */}
          {isAuthenticated && profile ? (
            <div className="relative ml-1">
              <button
                onClick={() => setShowUserDropdown((prev) => !prev)}
                className="flex items-center gap-2 p-1 min-h-[44px] min-w-[44px] justify-center rounded-lg hover:ring-2 hover:ring-[#6C5CE7] dark:hover:ring-[#CCFF00] transition-all cursor-pointer"
                aria-expanded={showUserDropdown}
                aria-label="User menu"
              >
                <Avatar
                  src={profile.avatarUrl}
                  name={profile.displayName || profile.fullName}
                  size="sm"
                  status="online"
                />
              </button>

              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] dark:bg-[#111114] rounded-xl border border-[#E3DFF5] dark:border-[#232329] shadow-[0_12px_32px_rgba(0,0,0,0.45)] py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-[#E3DFF5] dark:border-[#232329]">
                      <p className="text-xs font-black text-[#2D2A4A] dark:text-[#F4F4F6] truncate">
                        {profile.displayName || profile.fullName}
                      </p>
                      <p className="text-[11px] text-[#6B6890] dark:text-[#9E9EA9] truncate">
                        {profile.email}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]">
                          Level {gamification?.level || 1} Scholar
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-[#FFB84D]">
                          {gamification?.xp || 0} XP
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <User className="w-4 h-4 text-[#6C5CE7] dark:text-[#CCFF00]" />
                        Profile & Performance
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('gamification');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <Zap className="w-4 h-4 text-[#FFB84D]" />
                        Leaderboard & XP
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('user-guide');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <HelpCircle className="w-4 h-4 text-[#00B8A9]" />
                        User Guide & Quotas
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <LogIn className="w-4 h-4 text-[#6B6890] dark:text-[#9E9EA9]" />
                        Switch / Sign In Account
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#F25F5C] hover:bg-[#F25F5C]/10 flex items-center gap-2 cursor-pointer border-t border-[#E3DFF5] dark:border-[#232329] mt-1 min-h-[40px]"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2.5 min-h-[44px] rounded-lg bg-[#6C5CE7] hover:bg-[#5b4bc4] dark:bg-[#CCFF00] dark:hover:bg-[#b8e600] text-white dark:text-[#09090B] font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
