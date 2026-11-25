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
  ChevronDown,
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
  { id: 'learn', label: 'Learn', brief: 'Chapters & concepts', group: 'study', popular: true, icon: BookOpen },
  { id: 'practice', label: 'Practice', brief: 'Drills & diagnostic sets', group: 'study', popular: true, icon: Target },
  { id: 'copilot', label: 'Doubts', brief: 'Step-by-step AI tutor', group: 'ai', popular: true, icon: Bot },
  { id: 'create', label: 'Create', brief: 'Notes to quizzes', group: 'ai', popular: true, icon: Sparkles },
  { id: 'planner', label: 'Plan', brief: 'Daily timetable', group: 'track', popular: true, icon: Calendar },
  { id: 'focus', label: 'Focus', brief: 'Deep work timer', group: 'study', popular: true, icon: Clock },
  { id: 'mentor', label: 'Mentor', brief: 'Coaching & guidance', group: 'track', popular: true, icon: Compass },
  { id: 'leaderboard', label: 'Ranks', brief: 'Cohort standings', group: 'track', popular: true, icon: Trophy },
  { id: 'simulations', label: 'Simulations', brief: 'Interactive STEM labs', group: 'ai', icon: FlaskConical },
  { id: 'study-rooms', label: 'Study Rooms', brief: 'Peer collaboration', group: 'study', icon: Users },
  { id: 'voice-exam', label: 'Voice Exam', brief: 'Oral concept defense', group: 'ai', icon: Mic },
  { id: 'marketplace', label: 'Courses', brief: 'Structured modules', group: 'study', icon: ShoppingBag },
  { id: 'intelligence', label: 'Mistakes', brief: 'Error log & review', group: 'track', icon: BarChart3 },
  { id: 'forecaster', label: 'Forecaster', brief: 'Exam readiness range', group: 'track', icon: TrendingUp },
  { id: 'concepts', label: 'Concepts', brief: 'Topic dependency graph', group: 'study', icon: Library },
  { id: 'digital-archive', label: 'Archive', brief: 'Open textbooks', group: 'study', icon: BookMarked },
  { id: 'saved', label: 'Saved', brief: 'Bookmarked Q&A', group: 'study', icon: BookMarked },
  { id: 'gamification', label: 'Badges', brief: 'Rewards & milestones', group: 'track', icon: Award },
  { id: 'offline-sync', label: 'Offline Sync', brief: 'Mobile pack & queue', group: 'track', icon: RefreshCw },
  { id: 'user-guide', label: 'Guide', brief: 'Platform walkthroughs', group: 'study', icon: HelpCircle },
  { id: 'profile', label: 'Profile', brief: 'Goals & preferences', group: 'track', icon: User },
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

  const xpProgress = calculateLevelFromXp(user.xp);
  const solvedToday = gamification?.dailyQuestionsSolvedToday ?? user.dailyQuestionsSolvedToday ?? 0;
  const dailyGoalTarget = 10;
  const dailyGoalPercent = Math.min(100, Math.round((solvedToday / dailyGoalTarget) * 100));
  const currentStreakDays = gamification?.currentStreak ?? streakData.currentStreak ?? user.currentStreak ?? 0;

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
          label: 'Admin Studio',
          brief: 'Approvals & metrics',
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
          ? `Offline: saved ${pack.questions.length} questions (${pack.approxSizeKb} KB).`
          : syncedCount > 0
          ? `Synced ${syncedCount} attempt${syncedCount === 1 ? '' : 's'} & cached ${pack.questions.length} questions.`
          : `Study pack ready (${pack.questions.length} questions cached).`
      );
    } catch {
      setSyncStatusMsg('Sync failed — check browser storage settings and retry.');
    } finally {
      setPackDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Calm Hero Card: Greeting + Big "Ask a doubt" Primary CTA */}
      <Card variant="elevated" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                Level {xpProgress.level}
              </Badge>
              <span className="text-xs font-semibold text-[#6B6890] dark:text-[#B4B0D5] truncate">
                {user.targetExam || 'Daily STEM Study'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-sm text-[#6B6890] dark:text-[#B4B0D5]">
              Pick up your next lesson, keep your streak steady, or clear a doubt in seconds.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => onNavigate('copilot')}
            leftIcon={<Bot className="w-5 h-5" />}
            className="w-full md:w-auto min-h-[52px] px-7 text-base font-black shrink-0"
          >
            Ask a doubt
          </Button>
        </div>

        {/* 2. Three Calm Essentials: Today's Goal, Streak, XP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-[#E3DFF5] dark:border-[#3D3861]">
          {/* Today's Goal */}
          <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
              <span>Today&apos;s goal</span>
              <span className="tabular-nums text-[#2D2A4A] dark:text-[#F1EFFF]">
                {solvedToday}/{dailyGoalTarget} Qs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#00B8A9] shrink-0" />
              <span className="text-xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums">
                {dailyGoalPercent}%
              </span>
            </div>
            <Progress value={dailyGoalPercent} variant="secondary" size="sm" aria-label="Today's goal progress" />
          </div>

          {/* Streak */}
          <button
            type="button"
            onClick={() => setShowStreakModal(true)}
            className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] dark:hover:border-[#8577ED] text-left space-y-2 transition-colors cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
              <span>Study streak</span>
              <span className="text-[#6C5CE7] dark:text-[#A594FF]">View log</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FFB84D] fill-[#FFB84D] shrink-0" />
              <span className="text-xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums">
                {currentStreakDays} day{currentStreakDays === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
              Best: {user.longestStreak} days
            </p>
          </button>

          {/* XP */}
          <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6890] dark:text-[#B4B0D5]">
              <span>Experience</span>
              <span className="tabular-nums text-[#2D2A4A] dark:text-[#F1EFFF]">
                Lv {xpProgress.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-[#FFB84D] fill-[#FFB84D] shrink-0" />
              <span className="text-xl font-black text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums">
                {user.xp.toLocaleString()} XP
              </span>
            </div>
            <Progress value={xpProgress.progressPercent} variant="primary" size="sm" aria-label="Progress to next level" />
          </div>
        </div>
      </Card>

      {/* 3. Next Lesson & Today's Focus (with Loading / Empty / Error States) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
          <Card variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                  Next Lesson
                </h2>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                  Goal Progress · Stay on track with one focused step
                </p>
              </div>
              <Badge variant="secondary" size="sm">
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
              <div className="p-4 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                    {nextLesson.title}
                  </div>
                  <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
                    {nextLesson.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={onLaunchPractice}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Quick Drill
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => onNavigate(nextLesson.tab, nextLesson.context)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Lesson
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Spaced Review / Schedule Section */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00B8A9]" />
                <span>Spaced Review ({totalDueCount} due)</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('practice')} className="min-h-[44px]">
                Open Practice
              </Button>
            </div>

            {dueCards.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6" />}
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
                    className="p-3.5 rounded-2xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-[#00B8A9] uppercase">
                          {card.subjectId}
                        </span>
                        <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
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
                        className="min-h-[44px]"
                      >
                        Drill
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 pt-2 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                      {(
                        [
                          { label: 'Again', quality: 0 },
                          { label: 'Hard', quality: 2 },
                          { label: 'Good', quality: 4 },
                          { label: 'Easy', quality: 5 },
                        ] as Array<{ label: string; quality: SM2Quality }>
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSM2Grade(card, opt.quality)}
                          className="flex-1 min-h-[36px] rounded-lg bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
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

        {/* Right Column: Workspace Hub Directory */}
        <div className="lg:col-span-5 space-y-5">
          <Card variant="default" padding="md" className="space-y-3.5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                  Workspace Hub
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMoreCards((prev) => !prev)}
                  className="text-xs font-bold text-[#6C5CE7] dark:text-[#A594FF] flex items-center gap-1 min-h-[44px] px-2 cursor-pointer"
                >
                  <span>{showMoreCards ? 'Fewer extras' : 'Sync & Ranks'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreCards ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div
                role="tablist"
                aria-label="Filter dashboard tools"
                className="flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      navGroup === tab.id
                        ? 'bg-[#6C5CE7] dark:bg-[#8577ED] text-white'
                        : 'bg-[#F7F5FF] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {visibleDestinations.map((dest) => {
                const Icon = dest.icon;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => onNavigate(dest.id)}
                    className="min-h-[52px] p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#F0EDFA] dark:hover:bg-[#24203E] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] text-left flex items-center gap-2.5 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6C5CE7] dark:text-[#A594FF] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                        {dest.label}
                      </div>
                      <div className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5] truncate">
                        {dest.brief}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {showMoreCards && (
            <>
              {/* Cohort Standings */}
              <Card variant="default" padding="md" className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#FFB84D]" />
                    <span>Cohort Standings</span>
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('leaderboard')} className="min-h-[44px]">
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

              {/* Home Screen Install & Sync */}
              <Card variant="subtle" padding="md" className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#00B8A9]" />
                    <span>Offline Pack &amp; App</span>
                  </h3>
                  <Badge variant="success" size="sm">
                    <CloudCheck className="w-3 h-3 mr-1" />
                    {olympiadPack ? `${olympiadPack.questions.length} Qs` : 'Ready'}
                  </Badge>
                </div>
                <div className="text-[11px] font-semibold text-[#6B6890] dark:text-[#B4B0D5]">
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
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    />
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={packDownloading}
                    onClick={() => void handleSyncPackAndCloud()}
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${packDownloading ? 'animate-spin' : ''}`} />}
                    className="min-h-[44px]"
                  >
                    {packDownloading ? 'Syncing...' : olympiadPack ? 'Sync Pack' : 'Cache Study Pack'}
                  </Button>
                </div>
                {syncStatusMsg && (
                  <p role="status" className="text-xs font-semibold text-[#00B8A9]">
                    {syncStatusMsg}
                  </p>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {showStreakModal && (
        <StreakModal isOpen={showStreakModal} onClose={() => setShowStreakModal(false)} />
      )}
    </div>
  );
};
