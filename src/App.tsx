import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { RightContextPanel } from './components/layout/RightContextPanel';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationCenter } from './components/layout/NotificationCenter';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingWizard } from './components/auth/OnboardingWizard';

import { DashboardView } from './components/dashboard/DashboardView';
import { LearnView } from './components/learn/LearnView';
import { CreatorStudioView } from './components/create/CreatorStudioView';
import { MentorView } from './components/mentor/MentorView';
import { CopilotView } from './components/copilot/CopilotView';
import { PracticeView } from './components/practice/PracticeView';
import { PlannerView } from './components/planner/PlannerView';
import { GamificationView } from './components/gamification/GamificationView';
import { IntelligenceView } from './components/intelligence/IntelligenceView';
import { AdminStudioView } from './components/admin/AdminStudioView';
import { DocsViewer } from './components/docs/DocsViewer';
import { ProfileView } from './components/profile/ProfileView';
import { AuthView } from './components/auth/AuthView';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { ConceptLibraryView } from './components/concepts/ConceptLibraryView';
import { DigitalArchiveHub } from './components/learn/DigitalArchiveHub';
import { MobileAllTabsNav } from './components/layout/MobileAllTabsNav';

import { useAuth } from './context/AuthContext';
import { ConceptMastery, QuestionAttempt, SubjectId, UserProfile, NotificationItem } from './types';
import { INITIAL_MASTERIES, SEED_NOTIFICATIONS } from './data/seedData';
import { DAILY_PRACTICE_LIMIT } from './types/auth';
import { BrandLogo } from './components/ui/BrandLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ZenFocusCanvas } from './components/common/ZenFocusCanvas';
import { GenFocusTimerView } from './components/focus/GenFocusTimerView';
import { FormulaInspectorModal, FormulaInspectionData } from './components/common/FormulaInspectorModal';
import { FlashCheckModal } from './components/practice/FlashCheckModal';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Sparkles,
  Compass,
  Bot,
  Calendar,
  Award,
  BarChart3,
  ShieldCheck,
  FileCode2,
  User,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  const { user, profile, gamification, settings, isLoading, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [copilotContext, setCopilotContext] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('math');
  const [isFlashCheckOpen, setIsFlashCheckOpen] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [inspectedFormula, setInspectedFormula] = useState<FormulaInspectionData | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('learnco_theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('learnco_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('learnco_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Synchronize theme with UserSettings if defined
  useEffect(() => {
    if (settings?.theme) {
      if (settings.theme === 'dark') setIsDarkMode(true);
      else if (settings.theme === 'light') setIsDarkMode(false);
    }
  }, [settings?.theme]);

  // Concept masteries state
  const [masteries, setMasteries] = useState<ConceptMastery[]>(() => {
    const savedAttempts = localStorage.getItem('learnco_attempts');
    const hasAttempts = savedAttempts ? JSON.parse(savedAttempts).length > 0 : false;
    if (!hasAttempts) return [];
    const saved = localStorage.getItem('learnco_masteries');
    return saved ? JSON.parse(saved) : [];
  });

  const [attempts, setAttempts] = useState<QuestionAttempt[]>(() => {
    const saved = localStorage.getItem('learnco_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('learnco_notifications');
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('learnco_masteries', JSON.stringify(masteries));
  }, [masteries]);

  useEffect(() => {
    localStorage.setItem('learnco_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('learnco_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleSelectNotification = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    if (item.actionUrl) {
      setActiveTab(item.actionUrl);
      setIsNotificationOpen(false);
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Global keyboard shortcut for Search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global listener for interactive formula inspection, flash check, and zen mode
  useEffect(() => {
    const handleInspect = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.latex) {
        setInspectedFormula({ latex: detail.latex });
      }
    };
    const handleFlashCheck = () => setIsFlashCheckOpen(true);
    const handleZenToggle = () => setIsZenMode((prev) => !prev);

    window.addEventListener('learnco-inspect-formula', handleInspect);
    window.addEventListener('learnco-open-flash-check', handleFlashCheck);
    window.addEventListener('learnco-toggle-zen-mode', handleZenToggle);

    return () => {
      window.removeEventListener('learnco-inspect-formula', handleInspect);
      window.removeEventListener('learnco-open-flash-check', handleFlashCheck);
      window.removeEventListener('learnco-toggle-zen-mode', handleZenToggle);
    };
  }, []);

  const handleOpenCopilotWithContext = (context: string) => {
    setCopilotContext(context);
    setActiveTab('copilot');
  };

  const handleSelectSubject = (subjectId: SubjectId) => {
    setSelectedSubjectId(subjectId);
    setActiveTab('learn');
  };

  // Convert auth profile to legacy UserProfile view format
  const effectiveLegacyUser: UserProfile = {
    id: user?.id || 'guest-learner',
    fullName:
      profile?.displayName ||
      profile?.fullName ||
      (user?.email ? user.email.split('@')[0] : 'Guest Scholar'),
    email: user?.email || 'guest@learn.co',
    avatarUrl:
      profile?.avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.email || 'guest-scholar')}`,
    role: (user?.role || 'student') as any,
    joinedDate: profile?.joinedDate || new Date().toISOString().split('T')[0],
    xp: gamification?.xp ?? 0,
    level: gamification?.level ?? 1,
    currentStreak: gamification?.currentStreak ?? 0,
    longestStreak: gamification?.longestStreak ?? 0,
    dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
    dailyQuestionsSolvedToday: gamification?.dailyQuestionsSolvedToday || 0,
    targetExam: profile?.targetExam || 'Advanced STEM Diagnostics',
    targetScore: profile?.targetScore || 'Top 1% Percentile',
    examDate: profile?.examDate || '2026-11-15',
    subjects: profile?.subjects || ['math', 'cs'],
    studyTimeMinutesThisWeek: profile?.preferredStudyTimeMinutes ? profile.preferredStudyTimeMinutes * 5 : 0,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Initializing Learn.co Secure Kernel</h2>
          <p className="text-xs text-slate-400">Verifying session token and loading user matrix...</p>
        </div>
      </div>
    );
  }

  // If user is not signed in: Strict Authentication Gating
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
          <BrandLogo size="md" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl py-4">
            <AuthView onNavigateToTab={() => setActiveTab('dashboard')} />
          </div>
        </main>
      </div>
    );
  }

  // If new user needs onboarding
  if (
    isAuthenticated &&
    profile &&
    (profile.onboardingStatus === 'NOT_STARTED' || profile.onboardingStatus === 'IN_PROGRESS')
  ) {
    return <OnboardingWizard />;
  }

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Universal Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        onToggleContextPanel={() => setIsContextPanelOpen((prev) => !prev)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenFlashCheck={() => setIsFlashCheckOpen(true)}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        isZenMode={isZenMode}
      />

      {/* Main Body Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Nav Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dailyAllowanceRemaining={Math.max(
            0,
            DAILY_PRACTICE_LIMIT - (gamification?.dailyQuestionsSolvedToday ?? 0)
          )}
        />

        {/* Dynamic Center Stage Canvas with Zen Focus Canvas */}
        <ZenFocusCanvas isActive={isZenMode} onExit={() => setIsZenMode(false)}>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <ErrorBoundary
              fallbackTitle="STEM Workspace View Error"
              fallbackMessage="An unexpected issue occurred while rendering this tab. You can reload this view below."
            >
            {activeTab === 'dashboard' && (
              <DashboardView
                user={effectiveLegacyUser}
                masteries={masteries}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectSubject={handleSelectSubject}
              />
            )}

          {activeTab === 'concepts' && (
            <ConceptLibraryView
              onOpenCopilotWithContext={handleOpenCopilotWithContext}
              onNavigateToPractice={() => setActiveTab('practice')}
            />
          )}

          {activeTab === 'learn' && (
            <LearnView
              initialSubjectId={selectedSubjectId}
              onCompleteConcept={(conceptId, xpEarned) => {
                // Concept completed
              }}
              onOpenCopilotWithContext={handleOpenCopilotWithContext}
            />
          )}

          {activeTab === 'practice' && (
            <PracticeView onOpenCopilotWithContext={handleOpenCopilotWithContext} />
          )}

          {activeTab === 'focus' && (
            <GenFocusTimerView
              onNavigateToTab={(tab, ctx) => {
                if (ctx?.subjectId) setSelectedSubjectId(ctx.subjectId);
                setActiveTab(tab);
              }}
              onToggleZenMode={() => setIsZenMode((prev) => !prev)}
            />
          )}

          {activeTab === 'create' && (
            <CreatorStudioView onNavigateToPractice={() => setActiveTab('practice')} />
          )}

          {activeTab === 'mentor' && (
            <MentorView
              user={effectiveLegacyUser}
              masteries={masteries}
              attempts={attempts}
              onStartRevision={(conceptId) => setActiveTab('practice')}
              onNavigateToCopilot={(prompt) => {
                setCopilotContext(prompt || '');
                setActiveTab('copilot');
              }}
            />
          )}

          {activeTab === 'copilot' && (
            <CopilotView
              user={effectiveLegacyUser}
              initialContext={copilotContext}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'planner' && <PlannerView />}

          {activeTab === 'leaderboard' && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-200">
              <Leaderboard
                onNavigateToPrivacySettings={() => setActiveTab('profile')}
              />
            </div>
          )}

          {activeTab === 'gamification' && <GamificationView />}

          {activeTab === 'intelligence' && (
            <IntelligenceView
              user={effectiveLegacyUser}
              masteries={masteries}
              attempts={attempts}
              onNavigateTab={(tab, context) => {
                if (tab === 'copilot' && context?.prompt) {
                  setCopilotContext(context.prompt);
                }
                if (context?.subjectId) {
                  setSelectedSubjectId(context.subjectId);
                }
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'admin' && <AdminStudioView />}

          {activeTab === 'digital-archive' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
              <DigitalArchiveHub selectedSubject="math" />
            </div>
          )}

          {activeTab === 'docs' && <DocsViewer />}

          {activeTab === 'profile' && (
            <ProfileView onOpenCopilotWithContext={handleOpenCopilotWithContext} />
          )}

          {(activeTab === 'auth' ||
            activeTab === 'signin' ||
            activeTab === 'signup' ||
            activeTab === 'signout') && (
            <AuthView
              initialMode={
                activeTab === 'signup'
                  ? 'signup'
                  : activeTab === 'signout'
                  ? 'session'
                  : 'signin'
              }
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
          </ErrorBoundary>
        </main>
        </ZenFocusCanvas>

        {/* Right Collapsible Socratic Companion Panel */}
        <RightContextPanel
          isOpen={isContextPanelOpen}
          onClose={() => setIsContextPanelOpen(false)}
          activeSubject={selectedSubjectId}
          onAskCopilot={(prompt) => {
            setCopilotContext(prompt);
            setActiveTab('copilot');
            setIsContextPanelOpen(false);
          }}
        />
      </div>

      {/* Global Command Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onSelectConcept={(conceptId) => {
          setActiveTab('learn');
          setIsSearchOpen(false);
        }}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onSelectNotification={handleSelectNotification}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsNotificationOpen(false);
        }}
      />

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Mobile All-Tabs Navigation (Scrollable strip + Bottom Bar + All-Feature Drawer) */}
      <MobileAllTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dailyAllowanceRemaining={Math.max(
          0,
          DAILY_PRACTICE_LIMIT - (gamification?.dailyQuestionsSolvedToday ?? 0)
        )}
      />

      {/* Spaced-Repetition Micro-Quiz Modal (60s Flash Check) */}
      <FlashCheckModal
        isOpen={isFlashCheckOpen}
        onClose={() => setIsFlashCheckOpen(false)}
        onComplete={(xpEarned) => {
          // Can refresh gamification or show streak toast
        }}
        onAskCopilot={(prompt) => {
          setCopilotContext(prompt);
          setActiveTab('copilot');
          setIsFlashCheckOpen(false);
        }}
      />

      {/* Interactive Formula Inspector Tooltip & Invariant Modal */}
      <FormulaInspectorModal
        formulaData={inspectedFormula}
        onClose={() => setInspectedFormula(null)}
        onAskCopilot={(prompt) => {
          setCopilotContext(prompt);
          setActiveTab('copilot');
          setInspectedFormula(null);
        }}
      />
    </div>
  );
}
