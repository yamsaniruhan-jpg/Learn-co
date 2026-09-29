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
  KeyRound,
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

  const userXp = gamification?.xp ?? 420;
  const levelInfo = calculateLevelFromXp(userXp);

  const coreNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'concepts', label: 'Concept Library', icon: Library, highlight: true },
    { id: 'learn', label: 'Learn & Explore', icon: BookOpen },
    { id: 'practice', label: 'Practice Arena', icon: Target, badge: `${dailyAllowanceRemaining} left` },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
  ];

  const aiNav: NavItem[] = [
    { id: 'create', label: 'Creator Studio', icon: Sparkles, highlight: true },
    { id: 'copilot', label: 'Omni Copilot', icon: Bot },
    { id: 'mentor', label: 'Personal Mentor', icon: Compass },
  ];

  const intelligenceNav: NavItem[] = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, highlight: true },
    { id: 'intelligence', label: 'Mastery Matrix', icon: BarChart3 },
    { id: 'gamification', label: 'XP & Badges', icon: Award },
    { id: 'admin', label: 'Admin Studio', icon: ShieldCheck },
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
            action: () => {
              setActiveTab('auth');
            },
          },
        ]
      : []),
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none group cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive
                    ? 'text-white'
                    : item.color
                    ? item.color
                    : item.highlight
                    ? 'text-amber-500'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              {!isCollapsed && (
                <span className={`flex-1 text-left truncate ${item.color || ''}`}>{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : item.badge === 'Active'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
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
      className={`hidden md:flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur transition-all duration-200 shrink-0 ${
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
        <div className="my-2 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-purple-500/10 border border-amber-500/20 dark:border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Level {levelInfo.level}
              </span>
            </div>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
              {userXp.toLocaleString()} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, levelInfo.progressPercent))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{levelInfo.progressPercent}%</span>
              <span>{levelInfo.xpRemainingToNextLevel} XP to Lvl {levelInfo.level + 1}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-2 flex flex-col items-center justify-center p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold" title={`${userXp} XP (Level ${levelInfo.level})`}>
          <Zap className="w-3 h-3 fill-amber-500" />
          <span>L{levelInfo.level}</span>
        </div>
      )}

      {/* Collapse Toggle Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium select-none truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              {isAuthenticated ? `${profile?.displayName || user?.name || 'Scholar'}` : 'Guest Session'}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto md:mx-0 cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
