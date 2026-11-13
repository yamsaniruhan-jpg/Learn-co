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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateLevelFromXp } from '../../types/auth';

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
  highlight?: boolean;
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
  const ownerEmail = (user?.email || profile?.email || '').trim().toLowerCase();
  const isAdmin =
    user?.role === 'admin' ||
    profile?.role === 'admin' ||
    ownerEmail === 'yamsaniruhan@gmail.com';

  const coreNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'concepts', label: 'Concept Library', icon: Library },
    { id: 'learn', label: 'Learn & Explore', icon: BookOpen },
    { id: 'practice', label: 'Practice Arena', icon: Target, badge: `${dailyAllowanceRemaining} left` },
    { id: 'focus', label: 'Zen Focus Timer', icon: Clock },
    { id: 'simulations', label: 'Virtual Simulations', icon: FlaskConical, highlight: true },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'marketplace', label: 'Course Marketplace', icon: ShoppingBag },
    { id: 'user-guide', label: 'User Guide', icon: HelpCircle },
  ];

  const aiNav: NavItem[] = [
    { id: 'create', label: 'Creator Studio', icon: Sparkles, highlight: true },
    { id: 'copilot', label: 'Omni Copilot', icon: Bot, highlight: true },
    { id: 'mentor', label: 'Personal Mentor', icon: Compass },
    { id: 'voice-exam', label: 'Voice Oral Exam', icon: Mic },
  ];

  const intelligenceNav: NavItem[] = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'intelligence', label: 'Mastery Matrix', icon: BarChart3 },
    { id: 'forecaster', label: 'Exam Forecaster', icon: TrendingUp },
    { id: 'gamification', label: 'XP & Badges', icon: Award },
    { id: 'study-rooms', label: 'Peer Study Rooms', icon: Users },
    { id: 'offline-sync', label: 'PWA Offline Sync', icon: RefreshCw },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Studio', icon: ShieldCheck }] : []),
    { id: 'docs', label: 'Specs & Docs', icon: FileCode2 },
  ];

  const accountNav: NavItem[] = [
    { id: 'profile', label: 'My Profile & Notebook', icon: User },
    {
      id: 'auth',
      label: isAuthenticated ? 'Sign In / Switch User' : 'Sign In / Register',
      icon: LogIn,
      badge: isAuthenticated ? 'Active' : 'Guest',
    },
    ...(isAuthenticated
      ? [
          {
            id: 'signout',
            label: 'Sign Out',
            icon: LogOut,
            color: 'text-rose-500 hover:text-rose-600',
            action: async () => {
              await signOut();
              setActiveTab('auth');
            },
          },
        ]
      : []),
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-[11px] font-black text-[#6B6890] dark:text-[#B4B0D5] uppercase tracking-wider select-none">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setActiveTab(item.id);
                }
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all select-none group cursor-pointer ${
                isActive
                  ? 'bg-[#6C5CE7] text-white shadow-[0_2px_6px_rgba(108,92,231,0.25)]'
                  : 'text-[#2D2A4A] dark:text-[#F1EFFF] hover:text-[#6C5CE7] dark:hover:text-[#8577ED] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive
                    ? 'text-white'
                    : item.color
                    ? item.color
                    : item.highlight
                    ? 'text-[#FFB84D]'
                    : 'text-[#6B6890] dark:text-[#B4B0D5]'
                }`}
              />
              {!isCollapsed && (
                <span className={`flex-1 text-left truncate ${item.color || ''}`}>{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                    isActive
                      ? 'bg-white text-[#6C5CE7]'
                      : item.badge === 'Active'
                      ? 'bg-[#4CAF8E] text-white'
                      : 'bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] border border-[#E3DFF5] dark:border-[#3D3861]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`hidden md:flex flex-col border-r border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] transition-all duration-200 shrink-0 ${
        isCollapsed ? 'w-18 p-3' : 'w-64 p-4'
      }`}
    >
      <div className="flex-1 overflow-y-auto pr-1">
        {renderNavGroup('Core Learning', coreNav)}
        {renderNavGroup('AI & Creation', aiNav)}
        {renderNavGroup('Analytics & Studio', intelligenceNav)}
        {renderNavGroup('Account & Access', accountNav)}
      </div>

      {/* Real-time Level & XP Progress Card */}
      {!isCollapsed ? (
        <div className="my-2 p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-[#FFB84D] text-[#FFB84D]" />
              <span className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                Level {levelInfo.level}
              </span>
            </div>
            <span className="text-xs font-black text-[#6C5CE7] dark:text-[#8577ED]">
              {userXp.toLocaleString()} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-[#E3DFF5] dark:bg-[#3D3861] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6C5CE7] dark:bg-[#8577ED] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, levelInfo.progressPercent))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#6B6890] dark:text-[#B4B0D5] font-bold">
              <span>{levelInfo.progressPercent}%</span>
              <span>{levelInfo.xpRemainingToNextLevel} XP to Lvl {levelInfo.level + 1}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-2 flex flex-col items-center justify-center p-2 rounded-xl bg-[#FFB84D] text-[#2D2A4A] border border-[#e09d3b] text-[10px] font-black" title={`${userXp} XP (Level ${levelInfo.level})`}>
          <Zap className="w-3.5 h-3.5 fill-[#2D2A4A]" />
          <span>L{levelInfo.level}</span>
        </div>
      )}

      {/* Collapse Toggle Footer */}
      <div className="pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-[11px] text-[#6B6890] dark:text-[#B4B0D5] font-bold select-none truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF8E] shrink-0" />
            <span className="truncate">
              {isAuthenticated ? `${profile?.displayName || user?.name || 'Scholar'}` : 'Guest Session'}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6890] hover:text-[#2D2A4A] dark:text-[#B4B0D5] dark:hover:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors mx-auto md:mx-0 cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
