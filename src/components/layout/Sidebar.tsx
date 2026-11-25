import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Target,
  Calendar,
  Sparkles,
  Bot,
  Compass,
  BarChart3,
  Award,
  Trophy,
  ShieldCheck,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogIn,
  LogOut,
  User,
  Clock,
  HelpCircle,
  FlaskConical,
  Users,
  TrendingUp,
  Mic,
  RefreshCw,
  ShoppingBag,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateLevelFromXp } from '../../types/auth';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  dailyAllowanceRemaining: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  action?: () => void;
  color?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dailyAllowanceRemaining,
}) => {
  const { isAuthenticated, user, profile, gamification, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userXp = gamification?.xp ?? 0;
  const levelInfo = calculateLevelFromXp(userXp);
  const isAdmin = user?.role === 'admin' || profile?.role === 'admin';

  // Primary 1-word calm side rail
  const primaryNav: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Target, badge: dailyAllowanceRemaining > 0 ? dailyAllowanceRemaining : undefined },
    { id: 'copilot', label: 'Doubts', icon: Bot },
    { id: 'create', label: 'Create', icon: Sparkles },
    { id: 'planner', label: 'Plan', icon: Calendar },
    { id: 'focus', label: 'Focus', icon: Clock },
    { id: 'mentor', label: 'Mentor', icon: Compass },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
  ];

  const secondaryNav: NavItem[] = [
    { id: 'concepts', label: 'Concepts', icon: Library },
    { id: 'simulations', label: 'Simulations', icon: FlaskConical },
    { id: 'study-rooms', label: 'Study Rooms', icon: Users },
    { id: 'voice-exam', label: 'Voice Exam', icon: Mic },
    { id: 'marketplace', label: 'Courses', icon: ShoppingBag },
    { id: 'intelligence', label: 'Mistakes', icon: BarChart3 },
    { id: 'forecaster', label: 'Forecaster', icon: TrendingUp },
    { id: 'gamification', label: 'Badges', icon: Award },
    { id: 'offline-sync', label: 'Offline Sync', icon: RefreshCw },
    { id: 'user-guide', label: 'Guide', icon: HelpCircle },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
    { id: 'docs', label: 'Docs', icon: FileCode2 },
  ];

  const isSecondaryActive = secondaryNav.some((item) => item.id === activeTab);
  const [showMoreTools, setShowMoreTools] = useState<boolean>(isSecondaryActive);

  const accountNav: NavItem[] = [
    { id: 'profile', label: 'Profile', icon: User },
    {
      id: 'auth',
      label: isAuthenticated ? 'Account' : 'Sign In',
      icon: LogIn,
    },
    ...(isAuthenticated
      ? [
          {
            id: 'signout',
            label: 'Sign Out',
            icon: LogOut,
            color: 'text-[#F25F5C] dark:text-[#FA7270]',
            action: async () => {
              await signOut();
              setActiveTab('auth');
            },
          },
        ]
      : []),
  ];

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (item.action) {
            item.action();
          } else {
            setActiveTab(item.id);
          }
        }}
        title={isCollapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-colors select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7] ${
          isActive
            ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white shadow-[0_2px_8px_rgba(108,92,231,0.22)]'
            : 'text-[#2D2A4A] dark:text-[#F1EFFF] hover:text-[#6C5CE7] dark:hover:text-[#A594FF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33]'
        }`}
      >
        <Icon
          className={`w-4.5 h-4.5 shrink-0 ${
            isActive
              ? 'text-white'
              : item.color
              ? item.color
              : 'text-[#6B6890] dark:text-[#B4B0D5]'
          }`}
        />
        {!isCollapsed && (
          <span className={`flex-1 text-left truncate ${!isActive && item.color ? item.color : ''}`}>
            {item.label}
          </span>
        )}
        {!isCollapsed && item.badge !== undefined && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums shrink-0 ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6C5CE7] dark:text-[#A594FF]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`hidden md:flex flex-col border-r border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] transition-all duration-200 shrink-0 ${
        isCollapsed ? 'w-20 p-3' : 'w-60 p-4'
      }`}
    >
      <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
        <div className="space-y-1">{primaryNav.map(renderNavItem)}</div>

        <div className="pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861]">
          <button
            type="button"
            onClick={() => setShowMoreTools((prev) => !prev)}
            aria-expanded={showMoreTools}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider text-[#6B6890] dark:text-[#B4B0D5] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5 truncate">
              <MoreHorizontal className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>More Tools</span>}
            </span>
            {!isCollapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showMoreTools ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {showMoreTools && <div className="mt-1 space-y-1">{secondaryNav.map(renderNavItem)}</div>}
        </div>

        <div className="pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861] space-y-1">
          {accountNav.map(renderNavItem)}
        </div>
      </div>

      {/* Compact Level & XP Footer */}
      {!isCollapsed ? (
        <div className="my-2.5 p-3 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-[#FFB84D] text-[#FFB84D]" />
              <span className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                Level {levelInfo.level}
              </span>
            </div>
            <span className="text-xs font-black text-[#6C5CE7] dark:text-[#A594FF] tabular-nums">
              {userXp.toLocaleString()} XP
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#E3DFF5] dark:bg-[#3D3861] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6C5CE7] dark:bg-[#8577ED] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, levelInfo.progressPercent))}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          className="my-2 flex flex-col items-center justify-center p-2 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861] text-[10px] font-black"
          title={`${userXp} XP (Level ${levelInfo.level})`}
        >
          <Zap className="w-3.5 h-3.5 fill-[#FFB84D] text-[#FFB84D]" />
          <span>L{levelInfo.level}</span>
        </div>
      )}

      <div className="mb-2">
        <PWAInstallButton compact={isCollapsed} />
      </div>

      <div className="pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-xs text-[#6B6890] dark:text-[#B4B0D5] font-semibold truncate">
            <span className="w-2 h-2 rounded-full bg-[#4CAF8E] shrink-0" />
            <span className="truncate">
              {isAuthenticated ? `${profile?.displayName || user?.name || 'Scholar'}` : 'Guest'}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6890] hover:text-[#2D2A4A] dark:text-[#B4B0D5] dark:hover:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors mx-auto md:mx-0 cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
