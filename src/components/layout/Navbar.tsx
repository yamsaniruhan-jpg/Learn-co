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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../ui/BrandLogo';
import { Avatar } from '../ui/Avatar';
import { XPIndicator, StreakIndicator } from '../ui/GamificationIndicators';
import { DAILY_PRACTICE_LIMIT } from '../../types/auth';

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
}) => {
  const { user, profile, gamification, isAuthenticated, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const solvedToday = gamification?.dailyQuestionsSolvedToday ?? 0;
  const allowanceRemaining = Math.max(0, DAILY_PRACTICE_LIMIT - solvedToday);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 transition-colors">
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
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs w-56 lg:w-72 justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search STEM modules & tools...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Gamification Status, Quota, Notifications, Theme, and Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Icon Trigger */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Daily Allowance Quota Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 font-normal">Daily Quota:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {allowanceRemaining}/{DAILY_PRACTICE_LIMIT}
            </span>
          </div>

          {/* Streak Flame */}
          <div className="hidden sm:block">
            <StreakIndicator streak={gamification?.currentStreak ?? 0} size="sm" />
          </div>

          {/* XP Pill */}
          <XPIndicator xp={gamification?.xp ?? 0} size="sm" />

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Theme Toggle (Dark/Light) */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Toggle Right Context Companion Panel (Desktop) */}
          {onToggleContextPanel && (
            <button
              onClick={onToggleContextPanel}
              className="hidden lg:flex p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Study Companion"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}

          {/* User Profile Avatar with Dropdown or Sign In */}
          {isAuthenticated && profile ? (
            <div className="relative ml-1">
              <button
                onClick={() => setShowUserDropdown((prev) => !prev)}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition-all cursor-pointer"
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
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {profile.displayName || profile.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {profile.email}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Level {gamification?.level || 1} Scholar
                        </span>
                        <span className="text-[10px] text-slate-400">
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
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Profile & Performance
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('gamification');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Leaderboard & XP
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5 text-slate-400" />
                        Switch / Sign In Account
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
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
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
