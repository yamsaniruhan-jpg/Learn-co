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
  User,
  Menu,
  X,
  ChevronRight,
  BookMarked,
  Clock,
  HelpCircle,
  FlaskConical,
} from 'lucide-react';

interface MobileAllTabsNavProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  dailyAllowanceRemaining: number;
}

export interface NavFeature {
  id: string;
  label: string;
  shortLabel: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  highlight?: boolean;
}

export const ALL_APP_FEATURES: NavFeature[] = [
  {
    id: 'dashboard',
    label: 'Home Dashboard',
    shortLabel: 'Home',
    category: 'Core',
    icon: LayoutDashboard,
    description: 'Overview, streaks, daily goals and quick access',
  },
  {
    id: 'focus',
    label: 'Zen Focus Timer',
    shortLabel: 'Zen Focus',
    category: 'Core',
    icon: Clock,
    description: 'Deep work timer with ambient binaural soundscapes & XP pulses',
    highlight: true,
  },
  {
    id: 'simulations',
    label: 'Virtual Simulations Hub',
    shortLabel: 'Simulations',
    category: 'Core',
    icon: FlaskConical,
    description: 'Interactive STEM lab models, sign charts, and gradient descent optimizers',
    highlight: true,
  },
  {
    id: 'user-guide',
    label: 'User Guide & Manual',
    shortLabel: 'Guide',
    category: 'Core',
    icon: HelpCircle,
    description: 'Complete platform guide, feature walkthroughs & daily routines',
    highlight: true,
  },
  {
    id: 'learn',
    label: 'Curriculum & Learn',
    shortLabel: 'Learn',
    category: 'Core',
    icon: BookOpen,
    description: 'Interactive STEM curriculum, chapters, and concepts',
  },
  {
    id: 'practice',
    label: 'Practice Arena',
    shortLabel: 'Practice',
    category: 'Core',
    icon: Target,
    description: 'Diagnostic question ladder with instant Socratic feedback',
  },
  {
    id: 'copilot',
    label: 'Omni AI Copilot',
    shortLabel: 'Copilot',
    category: 'AI Tools',
    icon: Bot,
    description: 'Socratic first-principles reasoning and step-by-step guidance',
    highlight: true,
  },
  {
    id: 'create',
    label: 'Creator Studio',
    shortLabel: 'Create',
    category: 'AI Tools',
    icon: Sparkles,
    description: 'AI quiz, flashcard and curriculum generator from sources',
    highlight: true,
  },
  {
    id: 'planner',
    label: 'Study Planner',
    shortLabel: 'Plan',
    category: 'Organization',
    icon: Calendar,
    description: 'AI-generated adaptive schedules, goals, and daily tasks',
  },
  {
    id: 'concepts',
    label: 'Concept Matrix',
    shortLabel: 'Concepts',
    category: 'Core',
    icon: Library,
    description: 'Interconnected knowledge graph and mastery ratings',
  },
  {
    id: 'mentor',
    label: 'Personal Mentor',
    shortLabel: 'Mentor',
    category: 'Guidance',
    icon: Compass,
    description: '1-on-1 mentorship, doubt resolution, and mentor applications',
  },
  {
    id: 'leaderboard',
    label: 'Global Leaderboard',
    shortLabel: 'Ranks',
    category: 'Gamification',
    icon: Trophy,
    description: 'Global cohort standings, XP ladder, and milestone legacy',
    highlight: true,
  },
  {
    id: 'intelligence',
    label: 'Mistake Notebook',
    shortLabel: 'Notebook',
    category: 'Analytics',
    icon: BarChart3,
    description: 'Error log, retention intervals, and targeted remediation',
  },
  {
    id: 'digital-archive',
    label: 'Digital Archive & Books',
    shortLabel: 'Archive',
    category: 'Resources',
    icon: BookMarked,
    description: 'Free textbooks, research archives, and open educational resources',
  },
  {
    id: 'gamification',
    label: 'XP & Badges',
    shortLabel: 'Badges',
    category: 'Gamification',
    icon: Award,
    description: 'Achievements, badges, streaks, and scholarship milestones',
  },
  {
    id: 'profile',
    label: 'Scholar Profile',
    shortLabel: 'Profile',
    category: 'Account',
    icon: User,
    description: 'Account settings, exam dates, targets, and stats',
  },
  {
    id: 'admin',
    label: 'Admin Studio',
    shortLabel: 'Admin',
    category: 'System',
    icon: ShieldCheck,
    description: 'Platform metrics, mentor review, and system configurations',
  },
];

export const MobileAllTabsNav: React.FC<MobileAllTabsNavProps> = ({
  activeTab,
  setActiveTab,
  dailyAllowanceRemaining,
}) => {
  const [isOpenAllDrawer, setIsOpenAllDrawer] = useState(false);

  const primaryBottomTabs = [
    ALL_APP_FEATURES.find((f) => f.id === 'learn')!,
    ALL_APP_FEATURES.find((f) => f.id === 'practice')!,
    ALL_APP_FEATURES.find((f) => f.id === 'copilot')!,
    ALL_APP_FEATURES.find((f) => f.id === 'create')!,
    ALL_APP_FEATURES.find((f) => f.id === 'planner')!,
    ALL_APP_FEATURES.find((f) => f.id === 'profile')!,
  ];

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpenAllDrawer(false);
  };

  return (
    <>
      {/* 1. Mobile Horizontal Scrollable Quick-Switch Strip */}
      <nav
        aria-label="All Features Quick Scroll"
        className="md:hidden sticky top-16 z-25 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar py-2 px-3 flex items-center gap-1.5"
      >
        {ALL_APP_FEATURES.map((feat) => {
          const Icon = feat.icon;
          const isActive = activeTab === feat.id;
          return (
            <button
              key={`strip-${feat.id}`}
              onClick={() => handleSelect(feat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{feat.shortLabel}</span>
              {feat.id === 'practice' && dailyAllowanceRemaining > 0 && (
                <span className="text-[10px] px-1 rounded-full bg-indigo-500/30 text-white font-bold">
                  {dailyAllowanceRemaining}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 2. Mobile Bottom Navigation Bar with All-Features Drawer Trigger */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 py-1.5 flex items-center justify-around sticky bottom-0 z-40">
        {primaryBottomTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}

        {/* The 'All Tabs & Features' Trigger */}
        <button
          onClick={() => setIsOpenAllDrawer(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] cursor-pointer ${
            isOpenAllDrawer
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <Menu className="w-4 h-4 mb-0.5" />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <span>All Tabs</span>
        </button>
      </div>

      {/* 3. Full Mobile Navigation Drawer Modal ("All Tab Architecture") */}
      {isOpenAllDrawer && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="flex-1"
            onClick={() => setIsOpenAllDrawer(false)}
            aria-label="Close modal overlay"
          />

          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <Menu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>All Learn.co Tabs & Features</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch instantly to any area of the STEM platform
                </p>
              </div>

              <button
                onClick={() => setIsOpenAllDrawer(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                aria-label="Close all tabs drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of All Features */}
            <div className="p-4 overflow-y-auto space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_APP_FEATURES.map((feat) => {
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
                          {feat.highlight && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                              Pro
                            </span>
                          )}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};
