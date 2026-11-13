import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { RightContextPanel } from './components/layout/RightContextPanel';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationCenter } from './components/layout/NotificationCenter';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingWizard } from './components/auth/OnboardingWizard';

import { DashboardView } from './components/dashboard/DashboardView';
import { LearnView } from './components/learn/LearnView';
import { CopilotView } from './components/copilot/CopilotView';
import { PracticeView, PracticeNavigationContext } from './components/practice/PracticeView';
import { GamificationView } from './components/gamification/GamificationView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthView } from './components/auth/AuthView';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { MobileAllTabsNav } from './components/layout/MobileAllTabsNav';

import { useAuth } from './context/AuthContext';
import { ConceptMastery, QuestionAttempt, SubjectId, UserProfile, NotificationItem } from './types';
import { SEED_NOTIFICATIONS } from './data/seedData';
import { DAILY_PRACTICE_LIMIT } from './types/auth';
import { BrandLogo } from './components/ui/BrandLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ZenFocusCanvas } from './components/common/ZenFocusCanvas';
import { GenFocusTimerView } from './components/focus/GenFocusTimerView';
import { StudyRoomsView } from './components/common/StudyRoomsView';
import { ExamForecasterView } from './components/common/ExamForecasterView';
import { OfflineSyncView } from './components/common/OfflineSyncView';
import { FormulaInspectorModal, FormulaInspectionData } from './components/common/FormulaInspectorModal';
import { FlashCheckModal } from './components/practice/FlashCheckModal';
import { WalkthroughModal } from './components/common/WalkthroughModal';
import OmniCopilot from './components/OmniCopilot';
import { awardXp } from './utils/xpManager';
import { readStoredArray } from './utils/storageSafety';
import {
  Sparkles,
  ShieldCheck,
  Loader2,
  Sun,
  Moon,
  X,
} from 'lucide-react';

const SimulationsHubView = lazy(() =>
  import('./components/simulations/SimulationsHubView').then((m) => ({ default: m.SimulationsHubView }))
);
const ConceptLibraryView = lazy(() =>
  import('./components/concepts/ConceptLibraryView').then((m) => ({ default: m.ConceptLibraryView }))
);
const IntelligenceView = lazy(() =>
  import('./components/intelligence/IntelligenceView').then((m) => ({ default: m.IntelligenceView }))
);
const CreatorStudioView = lazy(() =>
  import('./components/create/CreatorStudioView').then((m) => ({ default: m.CreatorStudioView }))
);
const AdminStudioView = lazy(() =>
  import('./components/admin/AdminStudioView').then((m) => ({ default: m.AdminStudioView }))
);
const VoiceExamView = lazy(() =>
  import('./components/common/VoiceExamView').then((m) => ({ default: m.VoiceExamView }))
);
const DocsViewer = lazy(() =>
  import('./components/docs/DocsViewer').then((m) => ({ default: m.DocsViewer }))
);
const UserGuideView = lazy(() =>
  import('./components/guide/UserGuideView').then((m) => ({ default: m.UserGuideView }))
);
const MentorView = lazy(() =>
  import('./components/mentor/MentorView').then((m) => ({ default: m.MentorView }))
);
const PlannerView = lazy(() =>
  import('./components/planner/PlannerView').then((m) => ({ default: m.PlannerView }))
);
const DigitalArchiveHub = lazy(() =>
  import('./components/learn/DigitalArchiveHub').then((m) => ({ default: m.DigitalArchiveHub }))
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

  // Corrupt or stale local storage must not blank the entire app on startup.
  const [masteries, setMasteries] = useState<ConceptMastery[]>(() =>
    readStoredArray<QuestionAttempt>('learnco_attempts').length > 0
      ? readStoredArray<ConceptMastery>('learnco_masteries') : [],
  );
  const [attempts, setAttempts] = useState<QuestionAttempt[]>(() =>
    readStoredArray<QuestionAttempt>('learnco_attempts'),
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      if (!localStorage.getItem('learnco_notifications')) return SEED_NOTIFICATIONS;
    } catch { return SEED_NOTIFICATIONS; }
    return readStoredArray<NotificationItem>('learnco_notifications');
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

  // Keep App-level attempts and masteries live-synced when PracticeArena or OfflineSync records activity
  useEffect(() => {
    const syncLocalPracticeState = () => {
      try {
        const savedAttempts = JSON.parse(localStorage.getItem('learnco_attempts') || '[]');
        const savedMasteries = JSON.parse(localStorage.getItem('learnco_masteries') || '[]');
        setAttempts(Array.isArray(savedAttempts) ? savedAttempts : []);
        setMasteries(Array.isArray(savedMasteries) ? savedMasteries : []);
      } catch (_) {}
    };
    window.addEventListener('learnco_attempts_updated', syncLocalPracticeState);
    return () => window.removeEventListener('learnco_attempts_updated', syncLocalPracticeState);
  }, []);

  // Smart Study Reminder upon arrival (Deterministic, Zero AI cost)
  const [arrivalReminder, setArrivalReminder] = useState<{
    id: string;
    title: string;
    message: string;
    actionUrl: string;
    actionLabel: string;
  } | null>(null);

  useEffect(() => {
    const alreadyRemindedSession = sessionStorage.getItem('learnco_arrival_reminded');
    if (!alreadyRemindedSession) {
      sessionStorage.setItem('learnco_arrival_reminded', 'true');
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
        message = `You haven't practiced yet today. Solve 1 quick question to safeguard your streak and earn +10 XP.`;
        actionUrl = 'practice';
        actionLabel = 'Solve 1 Problem';
      } else if (missedCount > 0) {
        title = '📓 Mistake Notebook: Spaced Review Ready';
        message = `You have ${missedCount} concept problem${missedCount > 1 ? 's' : ''} queued for Ebbinghaus retention review.`;
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
  }, [attempts, gamification?.currentStreak, gamification?.dailyQuestionsSolvedToday]);

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
  if (!isAuthenticated || resetToken) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <header className="w-full border-b border-[#E3DFF5] dark:border-[#3D3861] bg-[#FFFFFF] dark:bg-[#2A2647] px-6 py-4 flex items-center justify-between shadow-xs">
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
            <AuthView initialResetToken={resetToken} onExitReset={() => setResetToken(null)} onNavigateToTab={() => setActiveTab('dashboard')} />
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
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#2D2A4A] dark:text-[#F1EFFF] flex flex-col font-sans selection:bg-[#6C5CE7] selection:text-white">
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
            {arrivalReminder && !isWalkthroughOpen && (
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
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#4CAF8E] text-white">
                        0 AI Tokens • Free
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
                <CreatorStudioView onNavigateToPractice={() => setActiveTab('practice')} />
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

        {/* Right Collapsible Socratic Companion Panel */}
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
      </div>

      {/* Global Command Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigateWithContext}
        onSelectConcept={() => {
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
          awardXp(xpEarned, 'Completed 60s Flash Check');
          setNotifications((prev) => [
            {
              id: `notif-fc-${Date.now()}`,
              type: 'achievement',
              title: `⚡ Flash Check Completed (+${xpEarned} XP)`,
              message: 'Spaced repetition retention intervals have been updated.',
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

      {/* First-Time Onboarding Walkthrough Tour */}
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

      {/* Floating Omni Copilot Widget */}
      {activeTab !== 'copilot' && !isZenMode && <OmniCopilot />}
    </div>
  );
}
