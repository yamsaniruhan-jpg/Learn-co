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
import { DASHBOARD_FIGURE_PLATES, STUDIO_FIGURES } from '../../assets/figures';

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
  { id: 'learn', label: 'Learn', brief: 'Study', group: 'study', popular: true, icon: BookOpen },
  { id: 'practice', label: 'Practice', brief: 'Drills', group: 'study', popular: true, icon: Target },
  { id: 'copilot', label: 'Doubts', brief: 'Tutor', group: 'ai', popular: true, icon: Bot },
  { id: 'create', label: 'Create', brief: 'Quizzes', group: 'ai', popular: true, icon: Sparkles },
  { id: 'planner', label: 'Plan', brief: 'Schedule', group: 'track', popular: true, icon: Calendar },
  { id: 'focus', label: 'Focus', brief: 'Timer', group: 'study', popular: true, icon: Clock },
  { id: 'mentor', label: 'Mentor', brief: 'Coach', group: 'track', popular: true, icon: Compass },
  { id: 'leaderboard', label: 'Ranks', brief: 'Standings', group: 'track', popular: true, icon: Trophy },
  { id: 'simulations', label: 'Labs', brief: 'Science', group: 'ai', icon: FlaskConical },
  { id: 'study-rooms', label: 'Rooms', brief: 'Collab', group: 'study', icon: Users },
  { id: 'voice-exam', label: 'Voice', brief: 'Oral', group: 'ai', icon: Mic },
  { id: 'marketplace', label: 'Courses', brief: 'Modules', group: 'study', icon: ShoppingBag },
  { id: 'intelligence', label: 'Mistakes', brief: 'Errors', group: 'track', icon: BarChart3 },
  { id: 'forecaster', label: 'Forecast', brief: 'Readiness', group: 'track', icon: TrendingUp },
  { id: 'concepts', label: 'Graph', brief: 'Map', group: 'study', icon: Library },
  { id: 'digital-archive', label: 'Archive', brief: 'Books', group: 'study', icon: BookMarked },
  { id: 'saved', label: 'Saved', brief: 'Bookmarks', group: 'study', icon: BookMarked },
  { id: 'gamification', label: 'Badges', brief: 'Rewards', group: 'track', icon: Award },
  { id: 'offline-sync', label: 'Offline', brief: 'Sync', group: 'track', icon: RefreshCw },
  { id: 'user-guide', label: 'Guide', brief: 'Help', group: 'study', icon: HelpCircle },
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP: Architectural Studio Hero Card with Fig. 04 Plate & Three Metrics */}
      <Card
        variant="elevated"
        padding="md"
        className="relative overflow-hidden space-y-5 sm:p-7 bg-[#FFFFFF] dark:bg-[#111114] border-[#E3DFF5] dark:border-[#232329]"
      >
        <div className="pointer-events-none absolute inset-0 grid-field-subtle opacity-60 dark:opacity-35" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 lg:gap-7 items-center">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant="primary"
                size="sm"
                className="bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] border-transparent font-extrabold tracking-wide"
              >
                Level {xpProgress.level}
              </Badge>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6B6890] dark:text-[#9E9EA9] truncate">
                {user.targetExam || 'Daily STEM Mastery'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#2D2A4A] dark:text-[#F4F4F6] truncate">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6B6890] dark:text-[#9E9EA9] max-w-xl leading-relaxed">
              Your personalized AI study headquarters — unified from raw concepts and simulations to active exam calibration.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => onNavigate('copilot')}
                leftIcon={<Bot className="w-4 h-4" />}
                className="w-full sm:w-auto min-h-[46px] px-5 sm:px-6 text-xs sm:text-sm font-black shrink-0"
              >
                Ask AI Doubt
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onLaunchPractice}
                leftIcon={<Play className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto min-h-[46px]"
              >
                Quick Drill
              </Button>
            </div>
          </div>

          {/* Fig. 04 — Precision STEM workspace visual plate */}
          <button
            type="button"
            onClick={() => onNavigate(STUDIO_FIGURES.workspace.targetTab)}
            className="group relative overflow-hidden rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#09090B] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7] dark:focus-visible:outline-[#CCFF00]"
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src={STUDIO_FIGURES.workspace.src}
                alt={STUDIO_FIGURES.workspace.alt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/35 to-transparent" />
            <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#CCFF00]">
                  {STUDIO_FIGURES.workspace.code} — {STUDIO_FIGURES.workspace.title}
                </p>
                <p className="text-[11px] font-medium text-[#D4D4D8] truncate mt-0.5">
                  {STUDIO_FIGURES.workspace.subtitle}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded border border-[#232329] bg-[#111114]/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#F4F4F6] group-hover:border-[#CCFF00]/60">
                Open
                <ArrowRight className="w-3 h-3 text-[#CCFF00]" />
              </span>
            </div>
          </button>
        </div>

        {/* Three Architectural Metrics: Daily Goal, Streak, Experience */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-4 border-t border-[#E3DFF5] dark:border-[#232329]">
          {/* Daily Goal */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6890] dark:text-[#9E9EA9]">
              <span className="font-mono uppercase tracking-[0.1em] text-[10px]">Daily Goal</span>
              <span className="tabular-nums font-bold text-[#2D2A4A] dark:text-[#F4F4F6]">
                {solvedToday}/{dailyGoalTarget} Qs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B8A9] dark:text-[#CCFF00] shrink-0" />
              <span className="text-lg sm:text-xl font-black text-[#2D2A4A] dark:text-[#F4F4F6] tabular-nums">
                {dailyGoalPercent}%
              </span>
            </div>
            <Progress value={dailyGoalPercent} variant="secondary" size="sm" aria-label="Daily goal progress" />
          </div>

          {/* Streak */}
          <button
            type="button"
            onClick={() => setShowStreakModal(true)}
            className="p-3.5 sm:p-4 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/60 text-left space-y-1.5 sm:space-y-2 transition-colors cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6890] dark:text-[#9E9EA9]">
              <span className="font-mono uppercase tracking-[0.1em] text-[10px]">Streak</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6C5CE7] dark:text-[#CCFF00] font-bold">
                Log
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-[#FFB84D] fill-[#FFB84D] shrink-0" />
              <span className="text-lg sm:text-xl font-black text-[#2D2A4A] dark:text-[#F4F4F6] tabular-nums">
                {currentStreakDays} day{currentStreakDays === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-[#6B6890] dark:text-[#9E9EA9]">
              Best: {longestStreakDays} days
            </p>
          </button>

          {/* Experience */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6890] dark:text-[#9E9EA9]">
              <span className="font-mono uppercase tracking-[0.1em] text-[10px]">Experience</span>
              <span className="tabular-nums font-bold text-[#2D2A4A] dark:text-[#F4F4F6]">
                Lv {xpProgress.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#6C5CE7] dark:text-[#CCFF00] shrink-0" />
              <span className="text-lg sm:text-xl font-black text-[#2D2A4A] dark:text-[#F4F4F6] tabular-nums">
                {totalUserXp.toLocaleString()} XP
              </span>
            </div>
            <Progress value={xpProgress.progressPercent} variant="primary" size="sm" aria-label="XP level progress" />
          </div>
        </div>
      </Card>

      {/* 2. SECOND SECTION: Workspace Hub (Architectural Tool Grid with category tabs) */}
      <Card
        variant="default"
        padding="md"
        className="space-y-3.5 sm:space-y-4 sm:p-6 bg-[#FFFFFF] dark:bg-[#111114] border-[#E3DFF5] dark:border-[#232329]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] flex items-center justify-center text-[#6C5CE7] dark:text-[#CCFF00]">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#2D2A4A] dark:text-[#F4F4F6] font-display tracking-tight">
                Workspace Hub
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-[#6B6890] dark:text-[#9E9EA9]">
                Direct access across all study, practice, and AI studios.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Filter workspace tools"
            className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(
              [
                { id: 'popular', label: 'Core' },
                { id: 'study', label: 'Study' },
                { id: 'ai', label: 'AI' },
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
                className={`min-h-[36px] sm:min-h-[38px] px-3 sm:px-3.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                  navGroup === tab.id
                    ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] border-transparent'
                    : 'bg-[#F7F5FF] dark:bg-[#09090B] text-[#6B6890] dark:text-[#9E9EA9] border-[#E3DFF5] dark:border-[#232329] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/50 hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Architectural Destination Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 pt-1">
          {visibleDestinations.map((dest) => {
            const Icon = dest.icon;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => onNavigate(dest.id)}
                className="group min-h-[54px] sm:min-h-[60px] p-2.5 rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/60 hover:bg-[#FFFFFF] dark:hover:bg-[#16161C] text-left flex items-center gap-2.5 transition-all cursor-pointer min-w-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#FFFFFF] dark:bg-[#111114] flex items-center justify-center shrink-0 text-[#6C5CE7] dark:text-[#CCFF00] transition-transform group-hover:scale-105">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-[#2D2A4A] dark:text-[#F4F4F6] truncate">
                    {dest.label}
                  </div>
                  <div className="text-[10px] font-medium text-[#6B6890] dark:text-[#9E9EA9] truncate">
                    {dest.brief}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. Studio Visual Plates (Fig. 01 - Fig. 03 matching Landing & Inside Studio) */}
      <section aria-label="Featured studio environments" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 bg-[#6C5CE7] dark:bg-[#CCFF00]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6B6890] dark:text-[#9E9EA9]">
              Studio plates · Fig. 01 — 03
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6890] dark:text-[#71717A]">
            Click any module plate to launch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {DASHBOARD_FIGURE_PLATES.map((fig) => (
            <button
              key={fig.id}
              type="button"
              onClick={() => onNavigate(fig.targetTab)}
              className="group relative overflow-hidden rounded-xl border border-[#E3DFF5] dark:border-[#232329] bg-[#FFFFFF] dark:bg-[#111114] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/60 text-left transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#09090B] border-b border-[#E3DFF5] dark:border-[#232329]">
                <img
                  src={fig.src}
                  alt={fig.alt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B]/85 via-transparent to-transparent" />
                <div className="absolute inset-x-3 top-2.5 flex items-center justify-between">
                  <span className="rounded border border-[#232329] bg-[#09090B]/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#CCFF00]">
                    {fig.code}
                  </span>
                  <span className="rounded border border-[#232329] bg-[#09090B]/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F4F4F6]">
                    {fig.badge}
                  </span>
                </div>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-[#2D2A4A] dark:text-[#F4F4F6] font-display flex items-center justify-between gap-2">
                    <span className="truncate">{fig.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#6B6890] dark:text-[#9E9EA9] group-hover:text-[#6C5CE7] dark:group-hover:text-[#CCFF00] transition-colors" />
                  </h3>
                  <p className="text-[11px] font-medium text-[#6B6890] dark:text-[#9E9EA9] mt-1 line-clamp-2">
                    {fig.caption}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B6890] dark:text-[#71717A] truncate">
                  {fig.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. FOURTH SECTION: Next Lesson, Spaced Review, Standings & Offline Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
          <Card
            variant="default"
            padding="md"
            className="space-y-3 sm:space-y-4 sm:p-6 bg-[#FFFFFF] dark:bg-[#111114] border-[#E3DFF5] dark:border-[#232329]"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#2D2A4A] dark:text-[#F4F4F6] font-display">
                  Next Scheduled Lesson
                </h2>
                <p className="text-[11px] sm:text-xs font-medium text-[#6B6890] dark:text-[#9E9EA9]">
                  Stay on track with your personalized curriculum roadmap
                </p>
              </div>
              <Badge
                variant="secondary"
                size="sm"
                className="font-mono"
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
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="text-sm sm:text-base font-black text-[#2D2A4A] dark:text-[#F4F4F6] truncate">
                    {nextLesson.title}
                  </div>
                  <p className="text-xs font-semibold text-[#6B6890] dark:text-[#9E9EA9]">
                    {nextLesson.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onLaunchPractice}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                  >
                    Drill
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate(nextLesson.tab, nextLesson.context)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Open
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Spaced Review / Active Recall Section */}
          <Card
            variant="default"
            padding="md"
            className="space-y-2.5 sm:space-y-3 bg-[#FFFFFF] dark:bg-[#111114] border-[#E3DFF5] dark:border-[#232329]"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-black text-[#2D2A4A] dark:text-[#F4F4F6] font-display flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#6C5CE7] dark:text-[#CCFF00]" />
                <span>Spaced Review ({totalDueCount} due)</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('practice')}
                className="min-h-[36px]"
              >
                Practice
              </Button>
            </div>

            {dueCards.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-5 h-5 text-[#4CAF8E]" />}
                title="Reviews caught up"
                description="No spaced repetition due right now."
                actionLabel="Practice"
                onAction={() => onNavigate('practice')}
                className="py-4"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dueCards.map((card) => (
                  <div
                    key={card.conceptId}
                    className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-[#6C5CE7] dark:text-[#CCFF00] uppercase">
                          {card.subjectId}
                        </span>
                        <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F4F4F6] truncate">
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
                        className="min-h-[34px]"
                      >
                        Drill
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 pt-1.5 border-t border-[#E3DFF5] dark:border-[#232329]">
                      {(
                        [
                          { label: 'Again', quality: 0, tone: 'text-[#F25F5C]' },
                          { label: 'Hard', quality: 2, tone: 'text-[#FFB84D]' },
                          { label: 'Good', quality: 4, tone: 'text-[#00B8A9]' },
                          { label: 'Easy', quality: 5, tone: 'text-[#4CAF8E]' },
                        ] as Array<{ label: string; quality: SM2Quality; tone: string }>
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSM2Grade(card, opt.quality)}
                          className={`flex-1 min-h-[32px] rounded-md bg-[#FFFFFF] dark:bg-[#111114] border border-[#E3DFF5] dark:border-[#232329] hover:border-[#6C5CE7] dark:hover:border-[#CCFF00]/50 text-[10px] font-extrabold transition-colors cursor-pointer ${opt.tone}`}
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
        <div className="lg:col-span-5 space-y-3.5 sm:space-y-5">
          {/* Cohort Standings Card */}
          <Card
            variant="default"
            padding="md"
            className="space-y-2 bg-[#FFFFFF] dark:bg-[#111114] border-[#E3DFF5] dark:border-[#232329]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F4F4F6] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#FFB84D]" />
                <span>Cohort Standings</span>
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('leaderboard')} className="min-h-[36px]">
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
            className="space-y-2.5 bg-[#FFFFFF] dark:bg-[#111114] border-[#E3DFF5] dark:border-[#232329]"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F4F4F6] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#00B8A9] dark:text-[#CCFF00]" />
                <span>Offline &amp; App</span>
              </h3>
              <Badge variant="success" size="sm">
                <CloudCheck className="w-3 h-3 mr-1" />
                {olympiadPack ? `${olympiadPack.questions.length} Qs` : 'Ready'}
              </Badge>
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#6B6890] dark:text-[#9E9EA9]">
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
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={packDownloading}
                onClick={() => void handleSyncPackAndCloud()}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${packDownloading ? 'animate-spin' : ''}`} />}
                className="min-h-[38px] text-xs"
              >
                {packDownloading ? 'Syncing...' : olympiadPack ? 'Sync Pack' : 'Cache Qs'}
              </Button>
            </div>
            {syncStatusMsg && (
              <p role="status" className="text-[11px] font-bold text-[#4CAF8E]">
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
