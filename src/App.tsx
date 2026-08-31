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

import { useAuth } from './context/AuthContext';
import { ConceptMastery, QuestionAttempt, SubjectId, UserProfile, NotificationItem } from './types';
import { INITIAL_MASTERIES, SEED_NOTIFICATIONS } from './data/seedData';
import { DAILY_PRACTICE_LIMIT } from './types/auth';
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
    const saved = localStorage.getItem('learnco_masteries');
    return saved ? JSON.parse(saved) : INITIAL_MASTERIES;
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
    id: user?.id || 'user-alex-001',
    fullName: profile?.displayName || profile?.fullName || user?.name || 'Learn.co Scholar',
    email: user?.email || 'alex.vance@stanford.edu',
    avatarUrl: profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: (user?.role || 'student') as any,
    joinedDate: profile?.joinedDate || 'August 2026',
    xp: gamification?.xp || 85,
    level: gamification?.level || 2,
    currentStreak: gamification?.currentStreak || 4,
    longestStreak: gamification?.longestStreak || 12,
    dailyAllowanceLimit: DAILY_PRACTICE_LIMIT,
    dailyQuestionsSolvedToday: gamification?.dailyQuestionsSolvedToday || 4,
    targetExam: profile?.targetExam || 'Advanced STEM Diagnostics',
    targetScore: profile?.targetScore || 'Top 1% Percentile',
    examDate: profile?.examDate || '2026-11-15',
    subjects: profile?.subjects || ['math', 'cs'],
    studyTimeMinutesThisWeek: profile?.preferredStudyTimeMinutes ? profile.preferredStudyTimeMinutes * 5 : 225,
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
      />

      {/* Main Body Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Nav Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dailyAllowanceRemaining={Math.max(
            0,
            DAILY_PRACTICE_LIMIT - (gamification?.dailyQuestionsSolvedToday || 4)
          )}
        />

        {/* Dynamic Center Stage Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={effectiveLegacyUser}
              masteries={masteries}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectSubject={handleSelectSubject}
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

          {activeTab === 'create' && <CreatorStudioView />}

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
        </main>

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

      {/* Mobile Bottom Navigation Bar (Optimized 44px+ touch targets) */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 py-1.5 flex justify-around sticky bottom-0 z-40">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'learn', label: 'Learn', icon: BookOpen },
          { id: 'practice', label: 'Practice', icon: Target },
          { id: 'copilot', label: 'Copilot', icon: Bot },
          { id: 'create', label: 'Create', icon: Sparkles },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
