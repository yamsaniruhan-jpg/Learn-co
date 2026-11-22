import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Flame,
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
  Download,
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
  ChevronRight,
} from 'lucide-react';
import { UserProfile, ConceptMastery, QuestionAttempt, SubjectId } from '../../types';
import { calculateLevelFromXp } from '../../types/auth';
import { SEED_SUBJECTS } from '../../data/seedData';
import { Leaderboard } from '../leaderboard/Leaderboard';
import { loadUserStreak, getRecentStudyMinutes, StreakData } from '../../utils/streakManager';
import { StreakHeatmapCard } from './StreakHeatmapCard';
import { StreakModal } from '../common/StreakModal';
import { OfflineStorageManager } from '../../utils/offlineStorage';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PlannerClient } from '../../services/plannerClient';
import { StudyTask } from '../../types/planner';
import {
  getDueReviewQueue,
  recordSM2Review,
  SM2CardState,
  SM2Quality,
} from '../../utils/spacedRepetition';

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
  { id: 'learn', label: 'Learn', brief: 'Chapters & visual proofs', group: 'study', popular: true, icon: BookOpen },
  { id: 'practice', label: 'Practice Arena', brief: 'Adaptive drills & XP', group: 'study', popular: true, icon: Target },
  { id: 'copilot', label: 'Omni Copilot', brief: 'Step-by-step AI tutor', group: 'ai', popular: true, icon: Bot },
  { id: 'create', label: 'Creator Studio', brief: 'PDF or URL to quizzes', group: 'ai', popular: true, icon: Sparkles },
  { id: 'marketplace', label: 'Courses', brief: 'Enrolled & live courses', group: 'study', popular: true, icon: ShoppingBag },
  { id: 'simulations', label: 'Simulations', brief: 'Interactive STEM labs', group: 'ai', popular: true, icon: FlaskConical },
  { id: 'study-rooms', label: 'Study Rooms', brief: 'Public & private rooms', group: 'study', popular: true, icon: Users },
  { id: 'voice-exam', label: 'Voice Exam', brief: 'Live mic oral defense', group: 'ai', popular: true, icon: Mic },
  { id: 'planner', label: 'Study Planner', brief: 'Daily tasks & timetable', group: 'track', popular: true, icon: Calendar },
  { id: 'mentor', label: '1-on-1 Mentor', brief: 'Goals, tasks & coaching', group: 'track', popular: true, icon: Compass },
  { id: 'intelligence', label: 'Mistake Log', brief: 'Weak areas & review', group: 'track', popular: true, icon: BarChart3 },
  { id: 'forecaster', label: 'Forecaster', brief: 'Exam readiness range', group: 'track', popular: true, icon: TrendingUp },
  { id: 'concepts', label: 'Concept Matrix', brief: 'Topic dependency graph', group: 'study', icon: Library },
  { id: 'digital-archive', label: 'Archive', brief: 'Free books & papers', group: 'study', icon: BookMarked },
  { id: 'focus', label: 'Zen Focus', brief: 'Timer & focus sounds', group: 'study', icon: Clock },
  { id: 'gamification', label: 'XP & Badges', brief: 'Milestones & rewards', group: 'track', icon: Award },
  { id: 'leaderboard', label: 'Leaderboard', brief: 'Cohort XP rankings', group: 'track', icon: Trophy },
  { id: 'offline-sync', label: 'Offline Sync', brief: 'Mobile pack & queue', group: 'track', icon: RefreshCw },
  { id: 'user-guide', label: 'User Guide', brief: 'Manual & workflows', group: 'study', icon: HelpCircle },
  { id: 'profile', label: 'Profile', brief: 'Targets & settings', group: 'track', icon: User },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  masteries,
  attempts = [],
  onNavigate,
  onLaunchPractice = () => onNavigate('practice'),
}) => {
  const [streakData, setStreakData] = useState<StreakData>(() =>
    loadUserStreak(user.id || 'default_user')
  );
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [packDownloading, setPackDownloading] = useState(false);
  const [packReady, setPackReady] = useState(() => Boolean(OfflineStorageManager.getOlympiadPack()));
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [upcomingTasks, setUpcomingTasks] = useState<StudyTask[]>([]);
  const [sm2Tick, setSm2Tick] = useState(0);
  const [navGroup, setNavGroup] = useState<NavGroup>('popular');

  useEffect(() => {
    const handleUpdate = () => {
      const fresh = loadUserStreak(user.id || 'default_user');
      setStreakData(fresh);
    };
    handleUpdate();
    window.addEventListener('learnco_streak_updated', handleUpdate);
    return () => window.removeEventListener('learnco_streak_updated', handleUpdate);
  }, [user.id]);

  useEffect(() => {
    let active = true;
    PlannerClient.getOverview()
      .then((res) => {
        if (!active) return;
        const pending = (res.tasks || [])
          .filter((t) => t.status !== 'COMPLETED' && t.status !== 'SKIPPED')
          .slice(0, 3);
        setUpcomingTasks(pending);
      })
      .catch(() => {
        if (active) setUpcomingTasks([]);
      });
    return () => {
      active = false;
    };
  }, [user.id]);

  const recentStudyMinutes = getRecentStudyMinutes(streakData);
  const xpProgress = calculateLevelFromXp(user.xp);
  const activeStreakCount = streakData.currentStreak ?? user.currentStreak ?? 0;
  const longestStreakCount = Math.max(streakData.longestStreak ?? 0, user.longestStreak ?? 0);

  const allowanceRemaining = Math.max(
    0,
    user.dailyAllowanceLimit - user.dailyQuestionsSolvedToday
  );

  const hasStartedPractice = attempts.length > 0;

  const averageMastery =
    hasStartedPractice && masteries.length > 0
      ? Math.round(
          masteries.reduce((acc, m) => acc + m.masteryScore, 0) / Math.max(1, masteries.length)
        )
      : 0;

  const weakConcepts = hasStartedPractice
    ? masteries.filter((m) => m.isWeakArea || m.masteryScore < 60)
    : [];

  const mentorNote = !hasStartedPractice
    ? 'Complete one drill to calibrate your local mastery estimate.'
    : weakConcepts.length > 0
    ? `Estimated mastery ${averageMastery}%. Review "${weakConcepts[0].conceptTitle}" (${weakConcepts[0].masteryScore}%).`
    : `Estimated mastery ${averageMastery}% across ${attempts.length} recorded attempts.`;

  const { dueCards, totalDueCount } = useMemo(
    () => getDueReviewQueue(user.id || 'default_user', masteries, attempts, new Date(), 4),
    [user.id, masteries, attempts, sm2Tick]
  );

  const handleSM2Grade = (card: SM2CardState, quality: SM2Quality) => {
    recordSM2Review(user.id || 'default_user', card, quality);
    setSm2Tick((t) => t + 1);
  };

  const quickPrompts = [
    {
      title: 'Derive First Derivative Test',
      category: 'Math',
      prompt: 'Derive the first derivative test for local extrema from first principles.',
    },
    {
      title: 'Gradient Descent Oscillation',
      category: 'CS',
      prompt: 'Why does learning rate step size cause oscillation in ravines?',
    },
    {
      title: 'Walden Inversion Geometry',
      category: 'Chemistry',
      prompt: 'Why does SN2 always invert tetrahedral chiral center geometry?',
    },
  ];

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

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 1. Compact Header Command & Telemetry Strip */}
      <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-5 shadow-[0_1px_4px_rgba(45,42,74,0.05)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#6B6890] dark:text-[#B4B0D5]">
              <span className="font-bold text-[#6C5CE7] dark:text-[#A497F7]">
                Level {user.level}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{user.targetExam || 'STEM Mastery'}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{allowanceRemaining} quota left</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black font-display tracking-tight text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5]">
              {activeStreakCount > 0
                ? `${activeStreakCount}-day streak active. Solve a quick set or pick any tool below.`
                : 'Start a quick practice drill today to ignite your study streak.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('learnco-open-flash-check'))}
              className="flex-1 sm:flex-none px-3 py-2 min-h-[38px] rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EFEBFD] dark:hover:bg-[#353057] border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="60-second flash check"
            >
              <Zap className="w-3.5 h-3.5 text-[#FFB84D] fill-[#FFB84D] shrink-0" />
              <span>60s Check</span>
            </button>
            <button
              type="button"
              onClick={onLaunchPractice}
              className="flex-1 sm:flex-none px-3.5 py-2 min-h-[38px] rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Start Practice</span>
            </button>
          </div>
        </div>

        {/* 4 Compact Micro Metrics (No Nested Cards) */}
        <div className="pt-3 border-t border-[#E3DFF5] dark:border-[#3D3861] grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
              <span className="font-semibold">Streak</span>
              <span className="tabular-nums">Best {longestStreakCount}d</span>
            </div>
            <div className="flex items-baseline gap-1 tabular-nums">
              <Flame className="w-3.5 h-3.5 text-[#FFB84D] fill-[#FFB84D] self-center shrink-0" />
              <span className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF]">
                {activeStreakCount}d
              </span>
              <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] truncate">active</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFB84D]"
                style={{ width: `${Math.min(100, (activeStreakCount / 7) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
              <span className="font-semibold">Mastery</span>
              <span className="tabular-nums truncate">
                {hasStartedPractice ? `${attempts.length} Qs` : 'Local'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-base font-black text-[#4CAF8E]">{averageMastery}%</span>
              <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] truncate">
                {hasStartedPractice ? 'estimate' : 'ready'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4CAF8E]"
                style={{ width: `${averageMastery}%` }}
              />
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
              <span className="font-semibold">Study (7d)</span>
              <span className="tabular-nums">Goal 240m</span>
            </div>
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-base font-black text-[#00B8A9]">{recentStudyMinutes}m</span>
              <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] truncate">logged</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00B8A9]"
                style={{ width: `${Math.min(100, (recentStudyMinutes / 240) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
              <span className="font-semibold">Experience</span>
              <span className="tabular-nums">{xpProgress.progressPercent}% Lv {xpProgress.level}</span>
            </div>
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-base font-black text-[#6C5CE7] dark:text-[#A497F7]">
                {user.xp.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">XP</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F0EDFA] dark:bg-[#1E1B33] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6C5CE7]"
                style={{ width: `${xpProgress.progressPercent}%` }}
                role="progressbar"
                aria-label="Progress to next level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={xpProgress.progressPercent}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Intuitive Streak Progress Bar + Interactive Calendar */}
      <StreakHeatmapCard
        streakData={streakData}
        onOpenStreakModal={() => setShowStreakModal(true)}
      />

      {/* 3. Navigate Anywhere Directory (Compact Small Tiles + Brief Explanation) */}
      <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-5 space-y-3 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
              Workspace Hub
            </h2>
            <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
              Jump directly to any learning studio, AI tool, or tracker.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter dashboard tools"
            className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(
              [
                { id: 'popular', label: 'Popular' },
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  navGroup === tab.id
                    ? 'bg-[#6C5CE7] text-white'
                    : 'bg-[#F0EDFA] dark:bg-[#1E1B33] text-[#6B6890] dark:text-[#B4B0D5] hover:text-[#2D2A4A] dark:hover:text-[#F1EFFF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {visibleDestinations.map((dest) => {
            const Icon = dest.icon;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => onNavigate(dest.id)}
                className="group p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EFEBFD] dark:hover:bg-[#332E56] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] text-left flex items-center gap-2.5 transition-colors cursor-pointer min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] text-[#6C5CE7] dark:text-[#A497F7] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] truncate group-hover:text-[#6C5CE7] dark:group-hover:text-[#A497F7]">
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
      </section>

      {/* 4. Compact Two-Column Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* STEM Curriculum Tracks (Compact) */}
          <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-5 space-y-3 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                  STEM Subjects
                </h2>
                <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                  Core concept decks, derivations, and visual proofs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className="text-xs font-bold text-[#6C5CE7] dark:text-[#A497F7] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>All tracks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SEED_SUBJECTS.map((subject) => {
                const subjectAttempts = attempts.filter((a) => a.subjectId === subject.id);
                const subjectMasteries = masteries.filter((m) => m.subjectId === subject.id);
                const actualMastery =
                  hasStartedPractice && subjectAttempts.length > 0 && subjectMasteries.length > 0
                    ? Math.round(
                        subjectMasteries.reduce((sum, m) => sum + m.masteryScore, 0) /
                          subjectMasteries.length
                      )
                    : 0;

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => onNavigate('learn', { subjectId: subject.id })}
                    className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] hover:bg-[#EFEBFD] dark:hover:bg-[#332E56] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] text-left space-y-2 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                            {subject.name}
                          </div>
                          <div className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5] tabular-nums">
                            {subject.courseCount} courses · {subject.conceptCount} concepts
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#2D2A4A] dark:text-[#F1EFFF] tabular-nums shrink-0">
                        {actualMastery}%
                      </span>
                    </div>

                    <div className="w-full bg-[#E3DFF5] dark:bg-[#2A2647] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${actualMastery}%`,
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Compact Remediation / Calibration Bar */}
          {hasStartedPractice && weakConcepts.length > 0 ? (
            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-rose-200 dark:border-rose-900/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-4 h-4 text-[#F25F5C] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                    {weakConcepts.length} Weak Area{weakConcepts.length === 1 ? '' : 's'} to Review
                  </div>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] truncate">
                    Lowest: {weakConcepts[0].conceptTitle} ({weakConcepts[0].masteryScore}%) — run a targeted drill.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="px-3 py-1.5 rounded-xl bg-[#F25F5C] hover:bg-[#dc4b48] text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                Remediate
              </button>
            </div>
          ) : !hasStartedPractice ? (
            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Target className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF]">
                    Calibrate Mastery Profile
                  </div>
                  <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                    Complete a short practice set to build your device-local mastery breakdown.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="px-3 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                Start First Session
              </button>
            </div>
          ) : null}

          {/* SM-2 Spaced Repetition Queue (Compact) */}
          <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-5 space-y-3 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#2D2A4A] dark:text-[#F1EFFF] font-display flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#6C5CE7] shrink-0" />
                  <span>Spaced Review (SM-2)</span>
                </h2>
                <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                  {totalDueCount > 0
                    ? `${totalDueCount} concept${totalDueCount === 1 ? '' : 's'} due for active recall.`
                    : 'All scheduled recall intervals are up to date.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="px-2.5 py-1 rounded-lg border border-[#E3DFF5] dark:border-[#3D3861] text-[11px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] shrink-0 cursor-pointer"
              >
                Arena
              </button>
            </div>

            {dueCards.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center gap-2 text-xs text-[#4CAF8E] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Spaced review queue cleared for today.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dueCards.map((card) => (
                  <div
                    key={card.conceptId}
                    className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#6C5CE7] dark:text-[#A497F7] tabular-nums">
                          {card.subjectId.toUpperCase()} · EF {card.easeFactor.toFixed(1)}
                        </span>
                        <h4 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                          {card.conceptTitle}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('practice', {
                            subjectId: card.subjectId,
                            conceptId: card.conceptId,
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-[#6C5CE7] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        Drill
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#E3DFF5] dark:border-[#3D3861]">
                      <span className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5]">Recall:</span>
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { label: 'Again', quality: 0 },
                            { label: 'Hard', quality: 2 },
                            { label: 'Good', quality: 4 },
                            { label: 'Easy', quality: 5 },
                          ] as Array<{ label: string; quality: SM2Quality }>
                        ).map((opt) => (
                          <button
                            type="button"
                            key={opt.label}
                            onClick={() => handleSM2Grade(card, opt.quality)}
                            className="px-1.5 py-0.5 rounded-md bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] hover:border-[#6C5CE7] text-[10px] font-bold text-[#2D2A4A] dark:text-[#F1EFFF] cursor-pointer"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Compact Socratic Prompts */}
          <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-4 space-y-2.5 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Quick Copilot Prompts</span>
              </h3>
              <span className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5]">
                Tap to ask step-by-step
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNavigate('copilot', { initialPrompt: item.prompt })}
                  className="p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] hover:border-[#6C5CE7] border border-[#E3DFF5] dark:border-[#3D3861] text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-[#6C5CE7] dark:text-[#A497F7] block">
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-[#2D2A4A] dark:text-[#F1EFFF] line-clamp-1">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Compact Summary Cards) */}
        <div className="space-y-4">
          {/* Upcoming Study Timetable */}
          <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-4 space-y-2.5 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Study Timetable</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="text-[11px] font-bold text-[#6C5CE7] dark:text-[#A497F7] hover:underline cursor-pointer"
              >
                Open Planner
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-dashed border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5]">
                  No study tasks scheduled yet.
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="text-[11px] font-bold text-[#6C5CE7] shrink-0 cursor-pointer"
                >
                  + Add
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] truncate">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-[#6B6890] dark:text-[#B4B0D5] truncate">
                        {task.conceptTitle || task.subjectId.toUpperCase()} · {task.estimatedDurationMinutes}m
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#6C5CE7] dark:text-[#A497F7] shrink-0 tabular-nums">
                      {task.scheduledStartTime || task.scheduledDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Compact Mentor & Creator Studio Actions */}
          <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] divide-y divide-[#E3DFF5] dark:divide-[#3D3861] shadow-[0_1px_4px_rgba(45,42,74,0.05)] overflow-hidden">
            <button
              type="button"
              onClick={() => onNavigate('mentor')}
              className="w-full p-3.5 text-left hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors flex items-start justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#00B8A9] shrink-0" />
                  <span>Mentor Insight</span>
                </div>
                <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] leading-snug">
                  {mentorNote}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8BAF] shrink-0 mt-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('create')}
              className="w-full p-3.5 text-left hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] transition-colors flex items-start justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB84D] shrink-0" />
                  <span>Creator Studio</span>
                </div>
                <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] leading-snug">
                  Turn PDFs, links, or notes into flashcards and practice quizzes.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8BAF] shrink-0 mt-0.5" />
            </button>
          </section>

          {/* Compact Cohort Leaderboard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#FFB84D]" />
                <span>Cohort Rankings</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('leaderboard')}
                className="text-[11px] font-bold text-[#6C5CE7] dark:text-[#A497F7] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
            <Leaderboard
              compact
              limit={4}
              showPodium={false}
              showSearch={false}
              showPrivacyNotice={false}
              onSelectScholar={() => onNavigate('leaderboard')}
            />
          </div>

          {/* Mobile App & Offline Sync (Compact) */}
          <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#2A2647] border border-[#E3DFF5] dark:border-[#3D3861] p-3.5 sm:p-4 space-y-2.5 shadow-[0_1px_4px_rgba(45,42,74,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#2D2A4A] dark:text-[#F1EFFF] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Mobile App &amp; Sync</span>
              </h3>
              <span className="text-[10px] font-bold text-[#4CAF8E]">
                {packReady ? 'Pack Ready' : 'PWA Ready'}
              </span>
            </div>
            <p className="text-[11px] text-[#6B6890] dark:text-[#B4B0D5] leading-snug">
              Add to your phone Home Screen and cache drills for offline study with automatic sync.
            </p>
            <div className="flex flex-wrap gap-2">
              {!isInstalled && isInstallable && (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#6C5CE7] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Add App</span>
                </button>
              )}
              <button
                type="button"
                disabled={packDownloading}
                onClick={async () => {
                  setPackDownloading(true);
                  try {
                    await OfflineStorageManager.downloadOlympiadPack();
                    setPackReady(true);
                    await OfflineStorageManager.syncPendingAttemptsToServer();
                  } finally {
                    setPackDownloading(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#F7F5FF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] text-[#2D2A4A] dark:text-[#F1EFFF] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${packDownloading ? 'animate-spin' : ''}`} />
                <span>{packDownloading ? 'Syncing...' : packReady ? 'Sync Pack' : 'Download Pack'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('offline-sync')}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#6C5CE7] dark:text-[#A497F7] hover:bg-[#F7F5FF] dark:hover:bg-[#1E1B33] cursor-pointer"
              >
                Sync Center
              </button>
            </div>
          </section>
        </div>
      </div>

      {showStreakModal && (
        <StreakModal isOpen={showStreakModal} onClose={() => setShowStreakModal(false)} />
      )}
    </div>
  );
};
