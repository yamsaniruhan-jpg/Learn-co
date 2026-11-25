import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  Target,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Compass,
  Trophy,
  Smartphone,
  RefreshCw,
  Bot,
  FlaskConical,
  Users,
  Mic,
  TrendingUp,
  BarChart3,
  Library,
  BookMarked,
  Award,
  HelpCircle,
  User,
  ShoppingBag,
  ShieldCheck,
  Flame,
  CloudCheck,
  Layers,
} from 'lucide-react';
import { UserProfile, ConceptMastery, QuestionAttempt, SubjectId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { calculateLevelFromXp } from '../../types/auth';
import { Leaderboard } from '../leaderboard/Leaderboard';
import { loadUserStreak, StreakData } from '../../utils/streakManager';
import { StreakModal } from '../common/StreakModal';
import {
  OfflineStorageManager,
  OfflineOlympiadPack,
  useNetworkStatus,
} from '../../utils/offlineStorage';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { syncClientToFirestore } from '../../services/clientFirestoreSync';
import { PlannerClient } from '../../services/plannerClient';
import { StudyTask } from '../../types/planner';
import {
  getDueReviewQueue,
  recordSM2Review,
  SM2CardState,
  SM2Quality,
} from '../../utils/spacedRepetition';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

interface DashboardViewProps {
  user: UserProfile;
  masteries: ConceptMastery[];
  attempts?: QuestionAttempt[];
  onNavigate: (tabId: string, context?: any) => void;
  onLaunchPractice?: () => void;
  onSelectSubject?: (subjectId: SubjectId) => void;
}

type NavGroup = 'popular' | 'study' | 'ai' | 'track' | 'all';

interface QuickDestination {
  id: string;
  label: string;
  brief: string;
  group: Exclude<NavGroup, 'popular' | 'all'>;
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const DESTINATIONS: QuickDestination[] = [
  { id: 'learn', label: 'Learn', brief: 'Chapters', group: 'study', popular: true, icon: BookOpen },
  { id: 'practice', label: 'Practice', brief: 'Drills', group: 'study', popular: true, icon: Target },
  { id: 'copilot', label: 'Doubts', brief: 'AI Tutor', group: 'ai', popular: true, icon: Bot },
  { id: 'create', label: 'Create', brief: 'Quizzes', group: 'ai', popular: true, icon: Sparkles },
  { id: 'planner', label: 'Plan', brief: 'Timetable', group: 'track', popular: true, icon: Calendar },
  { id: 'focus', label: 'Focus', brief: 'Deep work', group: 'study', popular: true, icon: Clock },
  { id: 'mentor', label: 'Mentor', brief: 'Coaching', group: 'track', popular: true, icon: Compass },
  { id: 'leaderboard', label: 'Ranks', brief: 'Standings', group: 'track', popular: true, icon: Trophy },
  { id: 'simulations', label: 'Labs', brief: 'STEM labs', group: 'ai', icon: FlaskConical },
  { id: 'study-rooms', label: 'Rooms', brief: 'Collab', group: 'study', icon: Users },
  { id: 'voice-exam', label: 'Voice Exam', brief: 'Oral defense', group: 'ai', icon: Mic },
  { id: 'marketplace', label: 'Courses', brief: 'Modules', group: 'study', icon: ShoppingBag },
  { id: 'intelligence', label: 'Mistakes', brief: 'Error log', group: 'track', icon: BarChart3 },
  { id: 'forecaster', label: 'Forecast', brief: 'Readiness', group: 'track', icon: TrendingUp },
  { id: 'concepts', label: 'Graph', brief: 'Dependency', group: 'study', icon: Library },
  { id: 'digital-archive', label: 'Archive', brief: 'Textbooks', group: 'study', icon: BookMarked },
  { id: 'saved', label: 'Saved', brief: 'Bookmarks', group: 'study', icon: BookMarked },
  { id: 'gamification', label: 'Badges', brief: 'Rewards', group: 'track', icon: Award },
  { id: 'offline-sync', label: 'Offline', brief: 'Sync pack', group: 'track', icon: RefreshCw },
  { id: 'user-guide', label: 'Guide', brief: 'Tutorials', group: 'study', icon: HelpCircle },
  { id: 'profile', label: 'Profile', brief: 'Settings', group: 'track', icon: User },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  masteries,
  attempts = [],
  onNavigate,
  onLaunchPractice = () => onNavigate('practice'),
}) => {
  const authContext = useAuth();
  const gamification = authContext?.gamification;
  const authUser = authContext?.user;
  const authProfile = authContext?.profile ?? null;
  const isAuthenticated = Boolean(authContext?.isAuthenticated);

  const [streakData, setStreakData] = useState<StreakData>(() =>
    loadUserStreak(user.id || 'default_user')
  );
  const [showStreakModal, setShowStreakModal] = useState(false);

  const { isOnline, pendingOfflineCount, lastSyncedAt, triggerSync } = useNetworkStatus();
  const [packDownloading, setPackDownloading] = useState(false);
  const [olympiadPack, setOlympiadPack] = useState<OfflineOlympiadPack | null>(() =>
    OfflineStorageManager.getOlympiadPack()
  );
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const { isInstalled } = usePWAInstall();

  const [upcomingTasks, setUpcomingTasks] = useState<StudyTask[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [sm2Tick, setSm2Tick] = useState(0);
  const [navGroup, setNavGroup] = useState<NavGroup>('popular');
  const [showMoreCards, setShowMoreCards] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setStreakData(loadUserStreak(user.id || 'default_user'));
    };
    handleUpdate();
    window.addEventListener('learnco_streak_updated', handleUpdate);
    return () => window.removeEventListener('learnco_streak_updated', handleUpdate);
  }, [user.id]);

  useEffect(() => {
    const refreshPack = () => setOlympiadPack(OfflineStorageManager.getOlympiadPack());
    window.addEventListener('learnco_olympiad_pack_updated', refreshPack);
    return () => window.removeEventListener('learnco_olympiad_pack_updated', refreshPack);
  }, []);

  const loadPlannerOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await PlannerClient.getOverview();
      const pending = (res.tasks || [])
        .filter((t) => t.status !== 'COMPLETED' && t.status !== 'SKIPPED')
        .slice(0, 3);
      setUpcomingTasks(pending);
    } catch (err: any) {
      setOverviewError(err?.message || 'Could not load today’s schedule.');
      setUpcomingTasks([]);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlannerOverview();
  }, [loadPlannerOverview, user.id]);

  // Robust Unified XP & Streak calculations to prevent glitches
  const uAny = user as unknown as Record<string, any>;
  const totalUserXp = Math.max(
    Number(uAny?.xp ?? 0),
    Number(gamification?.xp ?? 0),
    Number(authProfile?.xp ?? 0)
  );
  const xpProgress = calculateLevelFromXp(totalUserXp);
  const solvedToday = Math.max(
    gamification?.dailyQuestionsSolvedToday ?? 0,
    Number(uAny?.dailyQuestionsSolvedToday ?? 0)
  );
  const dailyGoalTarget = 10;
  const dailyGoalPercent = Math.min(100, Math.round((solvedToday / dailyGoalTarget) * 100));
  
  const currentStreakDays = Math.max(
    gamification?.currentStreak ?? 0,
    streakData.currentStreak ?? 0,
    Number(uAny?.currentStreak ?? 1),
    Number(authProfile?.currentStreak ?? 0)
  );
  const longestStreakDays = Math.max(
    Number(uAny?.longestStreak ?? 1),
    Number(streakData.longestStreak ?? 1),
    currentStreakDays
  );

  const { dueCards, totalDueCount } = useMemo(
    () => getDueReviewQueue(user.id || 'default_user', masteries, attempts, new Date(), 3),
    [user.id, masteries, attempts, sm2Tick]
  );

  const nextLesson = useMemo(() => {
    if (upcomingTasks.length > 0) {
      const t = upcomingTasks[0];
      return {
        label: t.subjectId.toUpperCase(),
        title: t.title,
        subtitle: `${t.estimatedDurationMinutes} min scheduled session`,
        tab: 'planner' as const,
        context: undefined,
      };
    }
    if (dueCards.length > 0) {
      const c = dueCards[0];
      return {
        label: c.subjectId.toUpperCase(),
        title: c.conceptTitle,
        subtitle: 'Due for active recall review',
        tab: 'practice' as const,
        context: { subjectId: c.subjectId, conceptId: c.conceptId },
      };
    }
    return {
      label: 'MATH',
      title: 'Limits, Continuity & Extrema',
      subtitle: 'Recommended next chapter in Learn',
      tab: 'learn' as const,
      context: { subjectId: 'math' },
    };
  }, [upcomingTasks, dueCards]);

  const handleSM2Grade = (card: SM2CardState, quality: SM2Quality) => {
    recordSM2Review(user.id || 'default_user', card, quality);
    setSm2Tick((t) => t + 1);
  };

  const allDestinations = useMemo(() => {
    if (user.role === 'admin') {
      return [
        ...DESTINATIONS,
        {
          id: 'admin',
          label: 'Admin',
          brief: 'Metrics',
          group: 'track' as const,
          icon: ShieldCheck,
        },
      ];
    }
    return DESTINATIONS;
  }, [user.role]);

  const visibleDestinations = useMemo(() => {
    if (navGroup === 'all') return allDestinations;
    if (navGroup === 'popular') return allDestinations.filter((d) => d.popular);
    return allDestinations.filter((d) => d.group === navGroup);
  }, [allDestinations, navGroup]);

  const handleSyncPackAndCloud = async () => {
    setPackDownloading(true);
    setSyncStatusMsg(null);
    try {
      const pack = await OfflineStorageManager.downloadOlympiadPack();
      setOlympiadPack(pack);
      const syncedCount = isOnline ? await triggerSync() : 0;

      if (isOnline && isAuthenticated && authUser) {
        try {
          await syncClientToFirestore(authUser, authProfile, gamification ?? null);
          OfflineStorageManager.markCloudSynced();
        } catch {
          // Local storage remains available offline
        }
      } else if (isOnline && syncedCount > 0) {
        OfflineStorageManager.markCloudSynced();
      }

      setSyncStatusMsg(
        !isOnline
          ? `Offline: saved ${pack.questions.length} questions.`
          : syncedCount > 0
          ? `Synced ${syncedCount} attempt${syncedCount === 1 ? '' : 's'} & cached ${pack.questions.length} Qs.`
          : `Study pack ready (${pack.questions.length} Qs cached).`
      );
    } catch {
      setSyncStatusMsg('Sync failed — check browser storage settings.');
    } finally {
      setPackDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP: Luminous Aurora Hero Card & Gemstone Essentials */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-6 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0F7FA] dark:from-[#211C4A] dark:via-[#2B225A] dark:to-[#123246] border-[#C7D2FE] dark:border-[#493E8A]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-[#5B4CE0] to-[#0891B2] border-transparent text-white font-black"
              >
                Level {xpProgress.level}
              </Badge>
              <span className="text-xs font-bold text-[#4338CA] dark:text-[#A5B4FC] truncate">
                {user.targetExam || 'Daily STEM Mastery'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#1E1B4B] dark:text-[#F5F3FF] truncate">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-sm font-medium text-[#475569] dark:text-[#C7D2FE]">
              Your personalized AI study headquarters &amp; rapid workspace.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => onNavigate('copilot')}
            leftIcon={<Bot className="w-5 h-5" />}
            className="w-full md:w-auto min-h-[52px] px-7 text-base font-black shrink-0 bg-gradient-to-r from-[#5B4CE0] via-[#7C3AED] to-[#0891B2] hover:from-[#4C3FD0] hover:via-[#6D28D9] hover:to-[#0E7490] text-white border-0 shadow-[0_6px_18px_rgba(91,76,224,0.28)]"
          >
            Ask AI Doubt
          </Button>
        </div>

        {/* Three Gemstone Essentials: Goal, Streak, XP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-[#C7D2FE]/70 dark:border-[#433A7D]">
          {/* Today's Goal — Emerald Mint */}
          <div className="p-4 rounded-2xl bg-[#ECFDF5] dark:bg-[#102E28] border border-[#A7F3D0] dark:border-[#1E5C4E] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#065F46] dark:text-[#A7F3D0]">
              <span>Daily Goal</span>
              <span className="tabular-nums text-[#064E3B] dark:text-[#ECFDF5]">
                {solvedToday}/{dailyGoalTarget} Qs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#059669] dark:text-[#34D399] shrink-0" />
              <span className="text-xl font-black text-[#064E3B] dark:text-[#ECFDF5] tabular-nums">
                {dailyGoalPercent}%
              </span>
            </div>
            <Progress value={dailyGoalPercent} variant="secondary" size="sm" aria-label="Daily goal progress" />
          </div>

          {/* Streak — Solar Amber */}
          <button
            type="button"
            onClick={() => setShowStreakModal(true)}
            className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-[#332216] border border-[#FDE68A] dark:border-[#6B4221] hover:border-[#F59E0B] dark:hover:border-[#FBBF24] text-left space-y-2 transition-colors cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center justify-between text-xs font-bold text-[#92400E] dark:text-[#FDE68A]">
              <span>Streak</span>
              <span className="text-[#C2410C] dark:text-[#FDBA74] font-extrabold">Log</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#EA580C] fill-[#F59E0B] dark:text-[#FBBF24] dark:fill-[#F97316] shrink-0" />
              <span className="text-xl font-black text-[#78350F] dark:text-[#FEF3C7] tabular-nums">
                {currentStreakDays} day{currentStreakDays === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#92400E] dark:text-[#FDE68A]">
              Best: {longestStreakDays} days
            </p>
          </button>

          {/* XP — Electric Orchid Violet */}
          <div className="p-4 rounded-2xl bg-[#F5F3FF] dark:bg-[#2A1D47] border border-[#DDD6FE] dark:border-[#53388F] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#5B21B6] dark:text-[#DDD6FE]">
              <span>Experience</span>
              <span className="tabular-nums text-[#4C1D95] dark:text-[#F5F3FF]">
                Lv {xpProgress.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-[#7C3AED] fill-[#A855F7] dark:text-[#E879F9] dark:fill-[#C084FC] shrink-0" />
              <span className="text-xl font-black text-[#4C1D95] dark:text-[#F5F3FF] tabular-nums">
                {totalUserXp.toLocaleString()} XP
              </span>
            </div>
            <Progress value={xpProgress.progressPercent} variant="primary" size="sm" aria-label="XP level progress" />
          </div>
        </div>
      </Card>

      {/* 2. SECOND TOP: Workspace Hub (Prominent Logo-First Grid with category tabs) */}
      <Card
        variant="default"
        padding="lg"
        className="space-y-4 bg-gradient-to-br from-[#FFFFFF] via-[#FAF8FF] to-[#F0FDFA] dark:from-[#242040] dark:via-[#201D38] dark:to-[#122D31] border-[#C7D2FE] dark:border-[#433A7D]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B4CE0] to-[#0891B2] flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1E1B4B] dark:text-[#F1EFFF] font-display tracking-tight">
                Workspace Hub
              </h2>
              <p className="text-xs font-semibold text-[#57537A] dark:text-[#B4B0D5]">
                Tap any tool logo for instant access across all study, practice &amp; AI studios.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Filter workspace tools"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(
              [
                { id: 'popular', label: 'Core' },
                { id: 'study', label: 'Study' },
                { id: 'ai', label: 'AI & Labs' },
                { id: 'track', label: 'Progress' },
                { id: 'all', label: `All (${allDestinations.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={navGroup === tab.id}
                onClick={() => setNavGroup(tab.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  navGroup === tab.id
                    ? 'bg-gradient-to-r from-[#5B4CE0] to-[#0891B2] text-white shadow-md scale-[1.02]'
                    : 'bg-[#F5F3FF] dark:bg-[#1E1B33] text-[#57537A] dark:text-[#B4B0D5] hover:bg-[#EDE9FE] dark:hover:bg-[#2A2447] hover:text-[#1E1B4B] dark:hover:text-[#F1EFFF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo-First Destination Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {visibleDestinations.map((dest) => {
            const Icon = dest.icon;
            const groupPalette =
              dest.group === 'study'
                ? {
                    tile: 'bg-[#F0F7FF] dark:bg-[#1A2842] hover:bg-[#E0EFFF] dark:hover:bg-[#223557] border-[#D6E6FF] dark:border-[#2C446B] hover:border-[#3B82F6]',
                    iconBox: 'bg-[#DBEAFE] dark:bg-[#223B61] border-[#BFDBFE] dark:border-[#355A8F] text-[#1D4ED8] dark:text-[#60A5FA]',
                  }
                : dest.group === 'ai'
                ? {
                    tile: 'bg-[#FAF5FF] dark:bg-[#2B1D42] hover:bg-[#F3E8FF] dark:hover:bg-[#382557] border-[#E9D5FF] dark:border-[#4B3173] hover:border-[#8B5CF6]',
                    iconBox: 'bg-[#F3E8FF] dark:bg-[#3B245C] border-[#DDD6FE] dark:border-[#5D3C8F] text-[#7E22CE] dark:text-[#D8B4FE]',
                  }
                : {
                    tile: 'bg-[#FFFBEB] dark:bg-[#2E2417] hover:bg-[#FEF3C7] dark:hover:bg-[#3D2F1D] border-[#FDE68A] dark:border-[#594322] hover:border-[#F59E0B]',
                    iconBox: 'bg-[#FEF3C7] dark:bg-[#473419] border-[#FCD34D] dark:border-[#705327] text-[#B45309] dark:text-[#FCD34D]',
                  };
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => onNavigate(dest.id)}
                className={`group min-h-[64px] p-3 rounded-2xl border text-left flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer min-w-0 ${groupPalette.tile}`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${groupPalette.iconBox}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-[#1E1B4B] dark:text-[#F1EFFF] truncate">
                    {dest.label}
                  </div>
                  <div className="text-[10px] font-semibold text-[#57537A] dark:text-[#C7C3E6] truncate">
                    {dest.brief}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. THIRD SECTION: Next Lesson & Spaced Review / Study Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
          <Card
            variant="default"
            padding="lg"
            className="space-y-4 bg-[#FFFFFF] dark:bg-[#242040] border-[#D8E2FA] dark:border-[#39426E]"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-[#1E1B4B] dark:text-[#F1EFFF] font-display">
                  Next Scheduled Lesson
                </h2>
                <p className="text-xs font-medium text-[#475569] dark:text-[#B4B0D5]">
                  Stay on track with your personalized curriculum roadmap
                </p>
              </div>
              <Badge
                variant="secondary"
                size="sm"
                className="bg-[#DBEAFE] dark:bg-[#1E3A5F] text-[#1D4ED8] dark:text-[#93C5FD] border-[#BFDBFE] dark:border-[#2E5082]"
              >
                {nextLesson.label}
              </Badge>
            </div>

            {isOverviewLoading ? (
              <CardSkeleton lines={2} />
            ) : overviewError ? (
              <EmptyState
                variant="error"
                icon={<AlertCircle className="w-6 h-6" />}
                title="Schedule unavailable"
                description={overviewError}
                action={
                  <Button variant="outline" size="md" onClick={loadPlannerOverview} leftIcon={<RefreshCw className="w-4 h-4" />}>
                    Retry
                  </Button>
                }
              />
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#F0F9FF] to-[#ECFEFF] dark:from-[#192847] dark:via-[#17304D] dark:to-[#123340] border border-[#BFDBFE] dark:border-[#2C4E78] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="text-base font-black text-[#0F172A] dark:text-[#F8FAFC] truncate">
                    {nextLesson.title}
                  </div>
                  <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#7DD3FC]">
                    {nextLesson.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={onLaunchPractice}
                    leftIcon={<Play className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />}
                    className="border-[#93C5FD] dark:border-[#3B6496] hover:bg-[#DBEAFE] dark:hover:bg-[#1E3A5F]"
                  >
                    Quick Drill
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => onNavigate(nextLesson.tab, nextLesson.context)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="bg-gradient-to-r from-[#0891B2] to-[#0D9488] hover:from-[#0E7490] hover:to-[#0F766E] text-white border-0"
                  >
                    Open Lesson
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Spaced Review / Active Recall Section */}
          <Card
            variant="default"
            padding="md"
            className="space-y-3 bg-[#FFFFFF] dark:bg-[#242040] border-[#CCEFE9] dark:border-[#255259]"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-[#1E1B4B] dark:text-[#F1EFFF] font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span>Spaced Review ({totalDueCount} due)</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('practice')}
                className="min-h-[44px] text-[#0F766E] dark:text-[#5EEAD4] hover:bg-[#CCFBF1]/60 dark:hover:bg-[#13383B]"
              >
                Open Practice
              </Button>
            </div>

            {dueCards.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6 text-[#059669] dark:text-[#34D399]" />}
                title="Reviews caught up"
                description="No spaced repetition concepts are due right now. Try a new practice set to queue tomorrow's review."
                actionLabel="Browse Practice"
                onAction={() => onNavigate('practice')}
                className="py-6"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dueCards.map((card) => (
                  <div
                    key={card.conceptId}
                    className="p-3.5 rounded-2xl bg-[#F0FDFA] dark:bg-[#132E33] border border-[#99F6E4] dark:border-[#23545B] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-extrabold text-[#0F766E] dark:text-[#5EEAD4] uppercase">
                          {card.subjectId}
                        </span>
                        <h3 className="text-xs font-black text-[#134E4A] dark:text-[#F0FDFA] truncate">
                          {card.conceptTitle}
                        </h3>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          onNavigate('practice', {
                            subjectId: card.subjectId,
                            conceptId: card.conceptId,
                          })
                        }
                        className="min-h-[44px] bg-[#0D9488] hover:bg-[#0F766E] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] dark:text-[#042F2E]"
                      >
                        Drill
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 pt-2 border-t border-[#99F6E4]/80 dark:border-[#23545B]">
                      {(
                        [
                          {
                            label: 'Again',
                            quality: 0,
                            tone: 'text-[#BE123C] dark:text-[#FDA4AF] hover:bg-[#FFF1F2] dark:hover:bg-[#4C1D2A] hover:border-[#F43F5E]',
                          },
                          {
                            label: 'Hard',
                            quality: 2,
                            tone: 'text-[#B45309] dark:text-[#FCD34D] hover:bg-[#FFFBEB] dark:hover:bg-[#452B12] hover:border-[#F59E0B]',
                          },
                          {
                            label: 'Good',
                            quality: 4,
                            tone: 'text-[#0E7490] dark:text-[#67E8F9] hover:bg-[#ECFEFF] dark:hover:bg-[#153B46] hover:border-[#06B6D4]',
                          },
                          {
                            label: 'Easy',
                            quality: 5,
                            tone: 'text-[#047857] dark:text-[#6EE7B7] hover:bg-[#ECFDF5] dark:hover:bg-[#123B2F] hover:border-[#10B981]',
                          },
                        ] as Array<{ label: string; quality: SM2Quality; tone: string }>
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSM2Grade(card, opt.quality)}
                          className={`flex-1 min-h-[36px] rounded-lg bg-[#FFFFFF] dark:bg-[#1D3C42] border border-[#CCFBF1] dark:border-[#2D626A] text-[11px] font-extrabold transition-colors cursor-pointer ${opt.tone}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Standings & Offline Sync */}
        <div className="lg:col-span-5 space-y-5">
          {/* Cohort Standings Card */}
          <Card
            variant="default"
            padding="md"
            className="space-y-2.5 bg-[#FFFDF5] dark:bg-[#292238] border-[#FDE68A] dark:border-[#5C441E]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#78350F] dark:text-[#FEF3C7] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#D97706] dark:text-[#FBBF24]" />
                <span>Cohort Standings</span>
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('leaderboard')} className="min-h-[44px] text-[#B45309] dark:text-[#FCD34D]">
                Ranks
              </Button>
            </div>
            <Leaderboard
              compact
              limit={4}
              showPodium={false}
              showSearch={false}
              showPrivacyNotice={false}
              onSelectScholar={() => onNavigate('leaderboard')}
            />
          </Card>

          {/* Home Screen Install & Sync Card */}
          <Card
            variant="subtle"
            padding="md"
            className="space-y-3 bg-gradient-to-br from-[#ECFDF5] to-[#F0FDFA] dark:from-[#122D2A] dark:to-[#122B36] border-[#A7F3D0] dark:border-[#245A52]"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-[#064E3B] dark:text-[#ECFDF5] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                <span>Offline Pack &amp; App</span>
              </h3>
              <Badge variant="success" size="sm">
                <CloudCheck className="w-3 h-3 mr-1" />
                {olympiadPack ? `${olympiadPack.questions.length} Qs` : 'Ready'}
              </Badge>
            </div>
            <div className="text-[11px] font-bold text-[#065F46] dark:text-[#A7F3D0]">
              {pendingOfflineCount} queued ·{' '}
              {lastSyncedAt
                ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : isOnline
                ? 'Online'
                : 'Offline'}
            </div>
            <div className="flex flex-wrap gap-2">
              {!isInstalled && (
                <PWAInstallButton
                  label="Add to Home Screen"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#5B4CE0] to-[#0891B2] hover:from-[#4C3FD0] hover:to-[#0E7490] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                />
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={packDownloading}
                onClick={() => void handleSyncPackAndCloud()}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${packDownloading ? 'animate-spin' : ''}`} />}
                className="min-h-[44px] bg-[#059669] hover:bg-[#047857] text-white"
              >
                {packDownloading ? 'Syncing...' : olympiadPack ? 'Sync Pack' : 'Cache Study Pack'}
              </Button>
            </div>
            {syncStatusMsg && (
              <p role="status" className="text-xs font-bold text-[#047857] dark:text-[#6EE7B7]">
                {syncStatusMsg}
              </p>
            )}
          </Card>
        </div>
      </div>

      {showStreakModal && (
        <StreakModal isOpen={showStreakModal} onClose={() => setShowStreakModal(false)} />
      )}
    </div>
  );
};
