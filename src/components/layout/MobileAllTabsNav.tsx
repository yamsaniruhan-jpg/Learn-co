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
  Users,
  TrendingUp,
  Mic,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    id: 'marketplace',
    label: 'Course Marketplace',
    shortLabel: 'Courses',
    category: 'Core',
    icon: ShoppingBag,
    description: 'Browse curated courses and structured learning modules',
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
    id: 'study-rooms',
    label: 'Peer Study Rooms',
    shortLabel: 'Study Rooms',
    category: 'Collaboration',
    icon: Users,
    description: 'Real-time collaborative study sessions and group streak bonuses',
  },
  {
    id: 'voice-exam',
    label: 'Voice Oral Exam',
    shortLabel: 'Voice Exam',
    category: 'AI Tools',
    icon: Mic,
    description: 'Speech-to-text Socratic oral examinations & concept defenses',
  },
  {
    id: 'forecaster',
    label: 'Exam Forecaster',
    shortLabel: 'Forecaster',
    category: 'Analytics',
    icon: TrendingUp,
    description: 'Predictive score ranges, percentile forecasts & readiness analytics',
  },
  {
    id: 'offline-sync',
    label: 'PWA Offline Sync',
    shortLabel: 'Offline Sync',
    category: 'System',
    icon: RefreshCw,
    description: 'Service worker status, offline curriculum cache & retry queue',
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

// Keep unknown categories visible after the known sections.
export const CATEGORY_ORDER = [
  'Core', 'AI Tools', 'Organization', 'Analytics', 'Gamification',
  'Resources', 'Collaboration', 'Guidance', 'System', 'Account',
];

export function groupNavFeatures<T extends { category: string }>(features: T[]) {
  const groups = new Map<string, T[]>();
  for (const feature of features) {
    const category = feature.category || 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(feature);
  }
  return [...groups.keys()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a), bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }).map((category) => ({ category, features: groups.get(category)! }));
}

export const MobileAllTabsNav: React.FC<MobileAllTabsNavProps> = ({
  activeTab,
  setActiveTab,
  dailyAllowanceRemaining,
}) => {
  const { user, profile } = useAuth();
  const [isOpenAllDrawer, setIsOpenAllDrawer] = useState(false);
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
      <nav aria-label="Mobile feature navigation" className="md:hidden border-t border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] px-1 py-1.5 flex items-center justify-around sticky bottom-0 z-40 shadow-[0_-2px_8px_rgba(45,42,74,0.06)]">
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
              <span>{item.shortLabel}</span>
              {item.id === 'practice' && dailyAllowanceRemaining > 0 && (
                <span className="absolute top-0.5 right-0.5 text-[9px] px-1 rounded-full bg-[#6C5CE7] text-white font-black">
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
          <div className="relative">
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#6C5CE7]" />
          </div>
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
            <div className="p-4 sm:p-5 border-b border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display flex items-center gap-2">
                  <Menu className="w-5 h-5 text-[#6C5CE7] dark:text-[#8577ED]" />
                  <span>All Learn.co Tabs & Features</span>
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-medium">
                  Switch instantly to any area of the STEM platform
                </p>
              </div>

              <button
                onClick={() => setIsOpenAllDrawer(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] cursor-pointer"
                aria-label="Close all tabs drawer"
              >
                <X className="w-5 h-5" />
              </button>
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
