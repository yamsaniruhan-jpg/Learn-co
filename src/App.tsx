import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import type { PracticeNavigationContext } from './components/practice/PracticeView';
import type { FormulaInspectionData } from './components/common/FormulaInspectorModal';
import { useAuth } from './context/AuthContext';
import { SubjectId, UserProfile, NotificationItem } from './types';
import { DAILY_PRACTICE_LIMIT } from './types/auth';
import { BrandLogo } from './components/ui/BrandLogo';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { awardXp } from './utils/xpManager';
import { useLocalPractice } from './utils/localPractice';
import { useLocalNotifications } from './utils/localNotifications';
import { lazyNamed } from './utils/lazyNamed';
import {
  Sparkles,
  ShieldCheck,
  Loader2,
  Sun,
  Moon,
  X,
} from 'lucide-react';

// Authenticated workspace shell & modals (excluded from signed-out boot waterfall)
const Navbar = lazy(() =>
  import('./components/layout/Navbar').then((m) => ({ default: m.Navbar }))
);
const Sidebar = lazy(() =>
  import('./components/layout/Sidebar').then((m) => ({ default: m.Sidebar }))
);
const RightContextPanel = lazy(() =>
  import('./components/layout/RightContextPanel').then((m) => ({ default: m.RightContextPanel }))
);
const GlobalSearchModal = lazy(() =>
  import('./components/layout/GlobalSearchModal').then((m) => ({ default: m.GlobalSearchModal }))
);
const AuthModal = lazy(() =>
  import('./components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const OnboardingWizard = lazy(() =>
  import('./components/auth/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard }))
);
const MobileAllTabsNav = lazy(() =>
  import('./components/layout/MobileAllTabsNav').then((m) => ({ default: m.MobileAllTabsNav }))
);
const ZenFocusCanvas = lazy(() =>
  import('./components/common/ZenFocusCanvas').then((m) => ({ default: m.ZenFocusCanvas }))
);
const FloatingGuideButton = lazy(() =>
  import('./components/common/FloatingGuideButton').then((m) => ({ default: m.FloatingGuideButton }))
);
const OmniCopilot = lazy(() => import('./components/OmniCopilot'));
const IOSInstallBanner = lazy(() =>
  import('./components/pwa/IOSInstallBanner').then((m) => ({ default: m.IOSInstallBanner }))
);

// Route-level & modal views tracked by tests/lazyViews.test.ts
const DashboardView = lazyNamed(
  () => import('./components/dashboard/DashboardView'),
  'DashboardView'
);
const LearnView = lazyNamed(
  () => import('./components/learn/LearnView'),
  'LearnView'
);
const CreatorStudioView = lazyNamed(
  () => import('./components/create/CreatorStudioView'),
  'CreatorStudioView'
);
const MentorView = lazyNamed(
  () => import('./components/mentor/MentorView'),
  'MentorView'
);
const CopilotView = lazyNamed(
  () => import('./components/copilot/CopilotView'),
  'CopilotView'
);
const PracticeView = lazyNamed(
  () => import('./components/practice/PracticeView'),
  'PracticeView'
);
const PlannerView = lazyNamed(
  () => import('./components/planner/PlannerView'),
  'PlannerView'
);
const GamificationView = lazyNamed(
  () => import('./components/gamification/GamificationView'),
  'GamificationView'
);
const IntelligenceView = lazyNamed(
  () => import('./components/intelligence/IntelligenceView'),
  'IntelligenceView'
);
const AdminStudioView = lazyNamed(
  () => import('./components/admin/AdminStudioView'),
  'AdminStudioView'
);
const DocsViewer = lazyNamed(
  () => import('./components/docs/DocsViewer'),
  'DocsViewer'
);
const ProfileView = lazyNamed(
  () => import('./components/profile/ProfileView'),
  'ProfileView'
);
const AuthView = lazyNamed(
  () => import('./components/auth/AuthView'),
  'AuthView'
);
const Leaderboard = lazyNamed(
  () => import('./components/leaderboard/Leaderboard'),
  'Leaderboard'
);
const ConceptLibraryView = lazyNamed(
  () => import('./components/concepts/ConceptLibraryView'),
  'ConceptLibraryView'
);
const DigitalArchiveHub = lazyNamed(
  () => import('./components/learn/DigitalArchiveHub'),
  'DigitalArchiveHub'
);
const SimulationsHubView = lazyNamed(
  () => import('./components/simulations/SimulationsHubView'),
  'SimulationsHubView'
);
const UserGuideView = lazyNamed(
  () => import('./components/guide/UserGuideView'),
  'UserGuideView'
);
const GenFocusTimerView = lazyNamed(
  () => import('./components/focus/GenFocusTimerView'),
  'GenFocusTimerView'
);
const StudyRoomsView = lazyNamed(
  () => import('./components/common/StudyRoomsView'),
  'StudyRoomsView'
);
const VoiceExamView = lazyNamed(
  () => import('./components/common/VoiceExamView'),
  'VoiceExamView'
);
const ExamForecasterView = lazyNamed(
  () => import('./components/common/ExamForecasterView'),
  'ExamForecasterView'
);
const OfflineSyncView = lazyNamed(
  () => import('./components/common/OfflineSyncView'),
  'OfflineSyncView'
);
const FormulaInspectorModal = lazyNamed(
  () => import('./components/common/FormulaInspectorModal'),
  'FormulaInspectorModal'
);
const FlashCheckModal = lazyNamed(
  () => import('./components/practice/FlashCheckModal'),
  'FlashCheckModal'
);
const WalkthroughModal = lazyNamed(
  () => import('./components/common/WalkthroughModal'),
  'WalkthroughModal'
);
const NotificationCenter = lazyNamed(
  () => import('./components/layout/NotificationCenter'),
  'NotificationCenter'
);
const Marketplace = lazy(() => import('./components/Marketplace'));

export default function App() {
  const { user, profile, gamification, settings, isLoading, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [resetToken, setResetToken] = useState<string | null>(() => {
    try { return new URLSearchParams(window.location.search).get('reset_token'); }
    catch { return null; }
  });
  useEffect(() => {
    if (!resetToken) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_token');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch { /* keep the reset flow usable if history cannot be changed */ }
  }, [resetToken]);
  const [copilotContext, setCopilotContext] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('math');
  const [practiceLaunchContext, setPracticeLaunchContext] = useState<PracticeNavigationContext | null>(null);
  const [isFlashCheckOpen, setIsFlashCheckOpen] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [inspectedFormula, setInspectedFormula] = useState<FormulaInspectionData | null>(null);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(() => {
    return !localStorage.getItem('learnco_walkthrough_seen');
  });

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

  const practiceAccountId = isAuthenticated && typeof user?.id === 'string' ? user.id : null;
  const { attempts, masteries } = useLocalPractice(practiceAccountId);
  const [notifications, setNotifications] = useLocalNotifications(practiceAccountId);

  // Smart Study Reminder upon arrival (Deterministic, Zero AI cost)
  const [arrivalReminder, setArrivalReminder] = useState<{
    accountId: string;
    id: string;
    title: string;
    message: string;
    actionUrl: string;
    actionLabel: string;
  } | null>(null);

  useEffect(() => {
    if (!practiceAccountId) return;
    const reminderKey = `learnco_arrival_reminded_v2:account:${encodeURIComponent(practiceAccountId)}`;
    const alreadyRemindedSession = sessionStorage.getItem(reminderKey);
    if (!alreadyRemindedSession) {
      sessionStorage.setItem(reminderKey, 'true');
      const hour = new Date().getHours();
      const currentStreak = gamification?.currentStreak ?? 0;
      const solvedToday = gamification?.dailyQuestionsSolvedToday ?? 0;
      const missedCount = attempts.filter((a) => !a.isCorrect).length;

      let title = 'Smart Study Reminder';
      let message = 'Welcome back! Ready to advance your STEM concept mastery today?';
      let actionUrl = 'practice';
      let actionLabel = 'Start Practice';

      if (solvedToday === 0 && currentStreak > 0) {
        title = `🔥 Protect Your ${currentStreak}-Day Streak!`;
        message = `You haven't practiced yet today. Try a question to build your practice habit.`;
        actionUrl = 'practice';
        actionLabel = 'Solve 1 Problem';
      } else if (missedCount > 0) {
        title = '📓 Mistake Notebook: Spaced Review Ready';
        message = `You have ${missedCount} incorrect practice attempt${missedCount > 1 ? 's' : ''} recorded on this device. Review the concepts you found difficult.`;
        actionUrl = 'intelligence';
        actionLabel = 'Review Mistakes';
      } else if (hour < 12) {
        title = '🌅 Morning High-Yield Focus Block';
        message = 'Working memory is at peak capacity. Tackle 3 diagnostic derivation questions.';
        actionUrl = 'practice';
        actionLabel = 'Practice Arena';
      } else if (hour >= 18) {
        title = '🎙️ Evening Oral Defense Examination';
        message = 'Test your verbal STEM articulation with 1 of 100 free pre-generated oral exam questions.';
        actionUrl = 'voice-exam';
        actionLabel = 'Oral Defense Exam';
      } else {
        title = '🔬 3D STEM Virtual Simulations';
        message = 'Experiment with interactive 3D multivariable calculus surfaces or oscillator phase plots.';
        actionUrl = 'simulations';
        actionLabel = 'Explore 3D Labs';
      }

      setArrivalReminder({
        accountId: practiceAccountId,
        id: `arrival-remind-${Date.now()}`,
        title,
        message,
        actionUrl,
        actionLabel,
      });

      // Also prepend to Notification Center so the user has persistent access
      setNotifications((prev) => [
        {
          id: `notif-arrival-${Date.now()}`,
          type: 'reminder',
          title,
          message,
          timestamp: 'Just now',
          isRead: false,
          actionUrl,
        },
        ...prev,
      ]);
    }
  }, [practiceAccountId, attempts, gamification?.currentStreak, gamification?.dailyQuestionsSolvedToday, setNotifications]);

  const [profileInitialTab, setProfileInitialTab] = useState<'analytics' | 'settings' | 'mistakes' | 'xp_trail'>('analytics');
  const [profileInitialSection, setProfileInitialSection] = useState<'account' | 'appearance' | 'learning' | 'notifications' | 'privacy'>('account');

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
    const handleOfflinePackLaunch = () => setActiveTab('practice');

    window.addEventListener('learnco-inspect-formula', handleInspect);
    window.addEventListener('learnco-open-flash-check', handleFlashCheck);
    window.addEventListener('learnco-toggle-zen-mode', handleZenToggle);
    window.addEventListener('learnco-launch-offline-olympiad-pack', handleOfflinePackLaunch);

    return () => {
      window.removeEventListener('learnco-inspect-formula', handleInspect);
      window.removeEventListener('learnco-open-flash-check', handleFlashCheck);
      window.removeEventListener('learnco-toggle-zen-mode', handleZenToggle);
      window.removeEventListener('learnco-launch-offline-olympiad-pack', handleOfflinePackLaunch);
    };
  }, []);

  const handleOpenCopilotWithContext = (context: string) => {
    setCopilotContext(context);
    setActiveTab('copilot');
  };

  const handleNavigateWithContext = (tabId: string, context?: any) => {
    if (context?.subjectId) {
      setSelectedSubjectId(context.subjectId);
    }
    if (tabId === 'practice' && context && (context.subjectId || context.topicId || context.conceptId || context.title)) {
      setPracticeLaunchContext({
        subjectId: context.subjectId,
        topicId: context.topicId,
        conceptId: context.conceptId,
        title: context.title,
      });
    }
    if (tabId === 'copilot' && (context?.prompt || context?.initialPrompt)) {
      setCopilotContext(context.prompt || context.initialPrompt);
    }
    setActiveTab(tabId);
  };

  const handleConsumePracticeContext = useCallback(() => {
    setPracticeLaunchContext(null);
  }, []);

  const isAdmin = user?.role === 'admin' || profile?.role === 'admin';
  const averageMasteryPercent =
    attempts.length > 0 && masteries.length > 0
      ? Math.round(masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length)
      : 0;

  // Convert auth profile to legacy UserProfile view format
  const effectiveLegacyUser: UserProfile = {
    id: user?.id || 'guest-learner',
    userId: user?.id || profile?.userId || 'guest-learner',
    fullName:
      profile?.displayName ||
      profile?.fullName ||
      (user?.email ? user.email.split('@')[0] : 'Guest Scholar'),
    email: user?.email || profile?.email || 'guest@learn.co',
    avatarUrl:
      profile?.avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.email || 'guest-scholar')}`,
    role: (isAdmin ? 'admin' : profile?.role || user?.role || 'student') as any,
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
    studyTimeMinutesThisWeek: profile?.studyTimeMinutesThisWeek ?? 0,
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

  // If user is not signed in: Flagship Live Website + Auth Portal
  if (!isAuthenticated || resetToken) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] flex flex-col font-sans selection:bg-[#6C5CE7] selection:text-white">
        <header className="w-full border-b border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="md" />
            <span className="hidden md:inline-block text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] border-l border-[#E3DFF5] dark:border-[#3D3861] pl-3 whitespace-nowrap">
              7 Subjects · IPhO · IChO · IBHO · IJSO · ICT
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              onClick={toggleTheme}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#6B6890] dark:text-[#B4B0D5] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Flagship Platform Overview */}
            <section className="lg:col-span-6 space-y-6 order-2 lg:order-1">
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#A594FF]">
                  Learn.co Academic Platform · Web &amp; Installable Mobile App
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#2D2A4A] dark:text-[#F1EFFF] leading-[1.1]">
                  First-Principles STEM &amp; Olympiad Mastery
                </h1>
                <p className="text-sm sm:text-base text-[#6B6890] dark:text-[#B4B0D5] leading-relaxed">
                  Study AP Calculus BC, Physics, Chemistry, Biology, English, Data Science, and Computer Science with interactive 3D and quantitative virtual laboratories, verified mentor workflows, and offline-ready practice sync.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#6C5CE7] dark:text-[#A594FF]">
                    International Olympiads
                  </div>
                  <div className="text-sm font-black mt-1">IPhO · IChO · IBHO · IJSO · ICT</div>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 leading-relaxed">
                    Dedicated olympiad chapters, competition theorems, and non-repeating calibrated problem ladders.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    11 Virtual Laboratories
                  </div>
                  <div className="text-sm font-black mt-1">3D WebGL, Optics, Dijkstra &amp; Bayes</div>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 leading-relaxed">
                    Manipulate parameters in thin-film optics, Nernst cells, enzyme kinetics, ROC thresholds, and prosody scansion.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Android, iOS &amp; Desktop PWA
                  </div>
                  <div className="text-sm font-black mt-1">Add to Home Screen &amp; Offline Sync</div>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 leading-relaxed">
                    Install straight to your phone home screen or download a desktop launcher with automatic offline attempt queueing.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    Verified Mentorship
                  </div>
                  <div className="text-sm font-black mt-1">Email Dispatch &amp; Approval Flow</div>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 leading-relaxed">
                    Connect with subject mentors through verified email notifications and real Firestore session tracking.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                    Install Learn.co on Mobile or Desktop
                  </div>
                  <div className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-0.5">
                    Auto-detects Android/iOS Home Screen installation or desktop `.url` / `.html` / `.webloc` / `.desktop` shortcuts.
                  </div>
                </div>
                <div className="shrink-0">
                  <PWAInstallButton />
                </div>
              </div>
            </section>

            {/* Right Sign-In / Sign-Up Card */}
            <section className="lg:col-span-6 w-full max-w-xl mx-auto lg:max-w-none order-1 lg:order-2">
              <Suspense
                fallback={
                  <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#6C5CE7] animate-spin" />
                  </div>
                }
              >
                <AuthView
                  initialResetToken={resetToken}
                  onExitReset={() => setResetToken(null)}
                  onNavigateToTab={() => setActiveTab('dashboard')}
                />
              </Suspense>
            </section>
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
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F7F5FF] dark:bg-[#1E1B33] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#6C5CE7] animate-spin" />
          </div>
        }
      >
        <OnboardingWizard />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] flex flex-col font-sans selection:bg-[#6C5CE7] selection:text-white">
      {/* Top Universal Navigation Bar */}
      <Suspense fallback={<div className="h-16 border-b border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647]" />}>
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
      </Suspense>

      {/* Main Body Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Nav Sidebar */}
        <Suspense fallback={null}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dailyAllowanceRemaining={Math.max(
              0,
              DAILY_PRACTICE_LIMIT - (gamification?.dailyQuestionsSolvedToday ?? 0)
            )}
          />
        </Suspense>

        {/* Dynamic Center Stage Canvas with Zen Focus Canvas */}
        <Suspense fallback={<div className="flex-1" />}>
          <ZenFocusCanvas isActive={isZenMode} onExit={() => setIsZenMode(false)}>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            <ErrorBoundary
              fallbackTitle="STEM Workspace View Error"
              fallbackMessage="An unexpected issue occurred while rendering this tab. You can reload this view below."
            >
            {arrivalReminder && arrivalReminder.accountId === practiceAccountId && !isWalkthroughOpen && (
              <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_8px_rgba(45,42,74,0.06)] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#6C5CE7] text-white shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-[#2D2A4A] dark:text-[#F1EFFF]">
                        {arrivalReminder.title}
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#4CAF8E] text-white">
                        0 AI Tokens · Free
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-0.5 font-medium">
                      {arrivalReminder.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setActiveTab(arrivalReminder.actionUrl);
                      setArrivalReminder(null);
                    }}
                    className="px-4 py-2 min-h-[40px] rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-black shadow-[0_2px_6px_rgba(108,92,231,0.25)] transition-colors cursor-pointer"
                  >
                    {arrivalReminder.actionLabel}
                  </button>
                  <button
                    onClick={() => setArrivalReminder(null)}
                    className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#6B6890] hover:text-[#2D2A4A] dark:text-[#B4B0D5] dark:hover:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors cursor-pointer"
                    aria-label="Dismiss smart reminder"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#6C5CE7] animate-spin" />
                  <p className="text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
                    Loading workspace module...
                  </p>
                </div>
              }
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={effectiveLegacyUser}
                  masteries={masteries}
                  attempts={attempts}
                  onNavigate={handleNavigateWithContext}
                  onSelectSubject={(subjectId) => {
                    setSelectedSubjectId(subjectId);
                    setActiveTab('learn');
                  }}
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
                  onCompleteConcept={() => {}}
                  onOpenCopilotWithContext={handleOpenCopilotWithContext}
                />
              )}

              {activeTab === 'practice' && (
                <PracticeView
                  key={practiceAccountId || 'signed-out'}
                  onOpenCopilotWithContext={handleOpenCopilotWithContext}
                  initialPracticeContext={practiceLaunchContext}
                  onConsumePracticeContext={handleConsumePracticeContext}
                />
              )}

              {activeTab === 'focus' && (
                <GenFocusTimerView
                  onNavigateToTab={handleNavigateWithContext}
                  onToggleZenMode={() => setIsZenMode((prev) => !prev)}
                  onAwardXp={(xp, reason) => awardXp(xp, reason)}
                />
              )}

              {activeTab === 'create' && (
                <CreatorStudioView key={practiceAccountId || 'signed-out'} onNavigateToPractice={() => setActiveTab('practice')} />
              )}

              {activeTab === 'mentor' && (
                <MentorView
                  user={effectiveLegacyUser}
                  masteries={masteries}
                  attempts={attempts}
                  onStartRevision={() => setActiveTab('practice')}
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

              {activeTab === 'simulations' && (
                <SimulationsHubView onNavigateToTab={(tab) => setActiveTab(tab)} />
              )}

              {activeTab === 'planner' && <PlannerView />}

              {activeTab === 'marketplace' && <Marketplace />}

              {activeTab === 'leaderboard' && (
                <div className="max-w-5xl mx-auto animate-in fade-in duration-200">
                  <Leaderboard
                    onNavigateToPrivacySettings={() => {
                      setProfileInitialTab('settings');
                      setProfileInitialSection('privacy');
                      setActiveTab('profile');
                    }}
                  />
                </div>
              )}

              {activeTab === 'gamification' && <GamificationView />}

              {activeTab === 'intelligence' && (
                <IntelligenceView
                  user={effectiveLegacyUser}
                  masteries={masteries}
                  attempts={attempts}
                  onNavigateTab={handleNavigateWithContext}
                />
              )}

              {activeTab === 'admin' &&
                (isAdmin ? (
                  <AdminStudioView />
                ) : (
                  <div className="max-w-xl mx-auto mt-12 p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                      Administrator Access Required
                    </h2>
                    <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                      Admin Studio is restricted to verified administrators. Return to your learning dashboard to continue studying.
                    </p>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-5 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold cursor-pointer"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ))}

              {activeTab === 'digital-archive' && (
                <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
                  <DigitalArchiveHub selectedSubject="math" />
                </div>
              )}

              {activeTab === 'docs' && <DocsViewer />}

              {activeTab === 'study-rooms' && <StudyRoomsView onNavigateToTab={(tab) => setActiveTab(tab)} />}
              {activeTab === 'voice-exam' && <VoiceExamView onNavigateToTab={(tab) => setActiveTab(tab)} />}
              {activeTab === 'forecaster' && <ExamForecasterView onNavigateToTab={(tab) => setActiveTab(tab)} />}
              {activeTab === 'offline-sync' && <OfflineSyncView onNavigateToTab={(tab) => setActiveTab(tab)} />}

              {(activeTab === 'user-guide' || activeTab === 'guide') && (
                <UserGuideView onNavigateToTab={handleNavigateWithContext} />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  onOpenCopilotWithContext={handleOpenCopilotWithContext}
                  initialTab={profileInitialTab}
                  initialSettingsSection={profileInitialSection}
                />
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
            </Suspense>
          </ErrorBoundary>
        </main>
        </ZenFocusCanvas>
        </Suspense>

        {/* Right Collapsible Socratic Companion Panel */}
        {isContextPanelOpen && (
          <Suspense fallback={null}>
            <RightContextPanel
              isOpen={isContextPanelOpen}
              onClose={() => setIsContextPanelOpen(false)}
              activeSubject={selectedSubjectId}
              averageMastery={averageMasteryPercent}
              activeStreak={gamification?.currentStreak ?? 0}
              onAskCopilot={(prompt) => {
                setCopilotContext(prompt);
                setActiveTab('copilot');
                setIsContextPanelOpen(false);
              }}
            />
          </Suspense>
        )}
      </div>

      {/* Global Command Search Modal (⌘K) */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={handleNavigateWithContext}
            onSelectConcept={() => {
              setActiveTab('learn');
              setIsSearchOpen(false);
            }}
          />
        </Suspense>
      )}

      {/* Notification Center Drawer */}
      {isNotificationOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Auth Modal (Sign In / Sign Up) */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </Suspense>
      )}

      {/* Mobile All-Tabs Navigation (Scrollable strip + Bottom Bar + All-Feature Drawer) */}
      <Suspense fallback={null}>
        <MobileAllTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dailyAllowanceRemaining={Math.max(
            0,
            DAILY_PRACTICE_LIMIT - (gamification?.dailyQuestionsSolvedToday ?? 0)
          )}
        />
      </Suspense>

      {/* Spaced-Repetition Micro-Quiz Modal (60s Flash Check) */}
      {isFlashCheckOpen && (
        <Suspense fallback={null}>
          <FlashCheckModal
            isOpen={isFlashCheckOpen}
            onClose={() => setIsFlashCheckOpen(false)}
            onComplete={(xpEarned) => {
              awardXp(xpEarned, 'Completed 60s Flash Check');
              setNotifications((prev) => [
                {
                  id: `notif-fc-${Date.now()}`,
                  type: 'achievement',
                  title: `⚡ Flash Check Completed (+${xpEarned} XP)`,
                  message: 'Sample flash check completed. Activity points are stored on this device; review intervals were not updated.',
                  timestamp: 'Just now',
                  isRead: false,
                  actionUrl: 'practice',
                },
                ...prev,
              ]);
            }}
            onAskCopilot={(prompt) => {
              setCopilotContext(prompt);
              setActiveTab('copilot');
              setIsFlashCheckOpen(false);
            }}
          />
        </Suspense>
      )}

      {/* Interactive Formula Inspector Tooltip & Invariant Modal */}
      {inspectedFormula && (
        <Suspense fallback={null}>
          <FormulaInspectorModal
            formulaData={inspectedFormula}
            onClose={() => setInspectedFormula(null)}
            onAskCopilot={(prompt) => {
              setCopilotContext(prompt);
              setActiveTab('copilot');
              setInspectedFormula(null);
            }}
          />
        </Suspense>
      )}

      {/* First-Time Onboarding Walkthrough Tour */}
      {isWalkthroughOpen && (
        <Suspense fallback={null}>
          <WalkthroughModal
            isOpen={isWalkthroughOpen}
            onClose={() => {
              setIsWalkthroughOpen(false);
              localStorage.setItem('learnco_walkthrough_seen', 'true');
            }}
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsWalkthroughOpen(false);
              localStorage.setItem('learnco_walkthrough_seen', 'true');
            }}
          />
        </Suspense>
      )}

      {/* Floating Guide Icon beside Floating Omni Copilot Widget */}
      {!isZenMode && (
        <Suspense fallback={null}>
          <FloatingGuideButton
            activeTab={activeTab}
            onNavigate={handleNavigateWithContext}
            copilotVisible={activeTab !== 'copilot'}
          />
        </Suspense>
      )}
      {activeTab !== 'copilot' && !isZenMode && (
        <Suspense fallback={null}>
          <OmniCopilot />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <IOSInstallBanner />
      </Suspense>
    </div>
  );
}
