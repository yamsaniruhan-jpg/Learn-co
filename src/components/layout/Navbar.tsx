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
    <header className="sticky top-0 z-30 w-full bg-[#FFFFFF] dark:bg-[#2A2647] border-b border-[#E3DFF5] dark:border-[#3D3861] transition-colors shadow-[0_1px_3px_rgba(45,42,74,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <BrandLogo size="md" />
          </div>

          {/* Quick Command Palette Button on Desktop */}
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E3DFF5] dark:border-[#3D3861] bg-[#F7F5FF] dark:bg-[#1E1B33] hover:border-[#6C5CE7] dark:hover:border-[#8577ED] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] transition-all text-xs w-56 lg:w-72 justify-between cursor-pointer min-h-[40px]"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#6B6890]" />
              <span>Search STEM modules & tools...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FFFFFF] dark:bg-[#2A2647] rounded border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Gamification Status, Quota, Notifications, Theme, and Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Icon Trigger */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33]"
            aria-label="Open Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Offline Mode Indicator if disconnected */}
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFB84D] text-[#2D2A4A] border border-[#e09d3b] text-xs font-black shadow-xs"
              title="Offline Mode: studying from local cached curriculum and offline attempts"
            >
              <WifiOff className="w-3.5 h-3.5 text-[#2D2A4A]" />
              <span className="hidden sm:inline">Offline Mode</span>
            </div>
          )}

          {/* Flash Check Quick Trigger Button */}
          {onOpenFlashCheck && (
            <button
              onClick={onOpenFlashCheck}
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1E1B33] hover:bg-[#F7F5FF] border border-[#FFB84D] text-[#2D2A4A] dark:text-[#F1EFFF] text-xs font-bold transition-all shadow-[0_1px_3px_rgba(45,42,74,0.06)] cursor-pointer min-h-[40px]"
              title="Start 60-second Spaced Retention Flash Check (+15 XP)"
            >
              <Zap className="w-4 h-4 fill-[#FFB84D] text-[#FFB84D]" />
              <span>Flash Check</span>
            </button>
          )}

          {/* Quick Zen Focus Timer Button */}
          <button
            onClick={() => setActiveTab('focus')}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'focus'
                ? 'bg-[#6C5CE7] text-white shadow-[0_2px_6px_rgba(108,92,231,0.25)]'
                : 'bg-[#FFFFFF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861]'
            }`}
            title="Open Zen Focus Timer Workspace"
          >
            <Clock className="w-3.5 h-3.5 text-[#6C5CE7] dark:text-[#8577ED]" />
            <span>Zen Focus</span>
          </button>

          {/* Quick User Guide Button */}
          <button
            onClick={() => setActiveTab('user-guide')}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'user-guide' || activeTab === 'guide'
                ? 'bg-[#6C5CE7] text-white shadow-[0_2px_6px_rgba(108,92,231,0.25)]'
                : 'bg-[#FFFFFF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861]'
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
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#6C5CE7] dark:hover:text-[#8577ED] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
              title={isZenMode ? "Exit Zen Mode" : "Enter Distraction-Free Zen Study Canvas (Esc to exit)"}
              aria-label="Toggle Zen Focus Mode"
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Daily Allowance Quota Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] text-xs font-bold border border-[#E3DFF5] dark:border-[#3D3861] min-h-[40px]">
            <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] font-semibold">Quota:</span>
            <span className="text-[#6C5CE7] dark:text-[#8577ED] font-black">
              {allowanceRemaining}/{DAILY_PRACTICE_LIMIT}
            </span>
          </div>

          {/* AI Hourly Quota Indicator */}
          <div className="hidden lg:block">
            <AIUsageIndicator userTier={user?.subscription} />
          </div>

          {/* Streak Flame */}
          <div className="hidden sm:block">
            <StreakIndicator streak={gamification?.currentStreak ?? 0} size="sm" />
          </div>

          {/* XP Pill */}
          <XPIndicator xp={gamification?.xp ?? 0} size="sm" />

          {/* In-App PWA Install Action */}
          <PWAInstallButton />

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#6C5CE7] ring-2 ring-[#FFFFFF] dark:ring-[#2A2647]" />
            )}
          </button>

          {/* Theme Toggle (Dark/Light) */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-[#FFB84D]" />
            ) : (
              <Moon className="w-5 h-5 text-[#6B6890]" />
            )}
          </button>

          {/* Toggle Right Context Companion Panel (Desktop) */}
          {onToggleContextPanel && (
            <button
              onClick={onToggleContextPanel}
              className="hidden lg:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#6C5CE7] dark:hover:text-[#8577ED] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
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
                className="flex items-center gap-2 p-1 min-h-[44px] min-w-[44px] justify-center rounded-full hover:ring-2 hover:ring-[#6C5CE7] transition-all cursor-pointer"
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
                    className="fixed inset-0 z-40 bg-[#2D2A4A]/20"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] dark:bg-[#2A2647] rounded-2xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_10px_28px_rgba(45,42,74,0.15)] py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-[#E3DFF5] dark:border-[#3D3861]">
                      <p className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                        {profile.displayName || profile.fullName}
                      </p>
                      <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] truncate">
                        {profile.email}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#6C5CE7] text-white">
                          Level {gamification?.level || 1} Scholar
                        </span>
                        <span className="text-[10px] font-extrabold text-[#FFB84D]">
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
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <User className="w-4 h-4 text-[#6C5CE7]" />
                        Profile & Performance
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('gamification');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <Zap className="w-4 h-4 text-[#FFB84D]" />
                        Leaderboard & XP
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('user-guide');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <HelpCircle className="w-4 h-4 text-[#00B8A9]" />
                        User Guide & Quotas
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] flex items-center gap-2 cursor-pointer min-h-[40px]"
                      >
                        <LogIn className="w-4 h-4 text-[#6B6890]" />
                        Switch / Sign In Account
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#F25F5C] hover:bg-[#F25F5C]/10 flex items-center gap-2 cursor-pointer border-t border-[#E3DFF5] dark:border-[#3D3861] mt-1 min-h-[40px]"
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
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-extrabold text-xs transition-colors flex items-center gap-2 shadow-[0_2px_6px_rgba(108,92,231,0.25)] cursor-pointer"
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
