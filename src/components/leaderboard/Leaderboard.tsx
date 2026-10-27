import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  ShieldCheck,
  Search,
  Users,
  TrendingUp,
  Filter,
  Calendar,
  Sparkles,
  ChevronRight,
  Info,
  Lock,
  ArrowUpRight,
  RefreshCw,
  EyeOff,
  Star,
  Layers,
  ArrowUp,
  Clock,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthClient } from '../../services/authClient';
import { LeaderboardEntry, TimeframeFilter } from '../../types/auth';
import { fetchFirestoreLeaderboardEntries, subscribeToFirestoreLeaderboard } from '../../services/clientFirestoreSync';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Progress } from '../ui/Progress';
import { EmptyState } from '../ui/EmptyState';
import { loadUserStreak } from '../../utils/streakManager';
import {
  LEADERBOARD_STAGES,
  LeaderboardStage,
  LeaderboardSubstage,
  calculateStageFromXp,
  getPromotionZoneInfo,
  getWeeklyResetCountdown,
} from './stagesConfig';
import { StagesLadderModal } from './StagesLadderModal';

export interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  initialTimeframe?: TimeframeFilter;
  timeframe?: TimeframeFilter;
  onTimeframeChange?: (timeframe: TimeframeFilter) => void;
  subject?: string;
  onSubjectChange?: (subject: string) => void;
  compact?: boolean;
  limit?: number;
  showPodium?: boolean;
  showSearch?: boolean;
  showPrivacyNotice?: boolean;
  onSelectScholar?: (scholar: LeaderboardEntry) => void;
  onNavigateToPrivacySettings?: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

const TIMEFRAME_OPTIONS: { id: TimeframeFilter; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'weekly', label: 'This Week', description: 'Weekly cohort league sprint with promotion zones', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'daily', label: 'Today', description: 'XP gained from today\'s practice sessions', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'monthly', label: 'This Month', description: 'Monthly endurance & mastery progression', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'all_time', label: 'All-Time', description: 'Cumulative XP and milestone legacy', icon: <Trophy className="w-3.5 h-3.5" /> },
];

const SUBJECT_OPTIONS = [
  { id: 'all', label: 'All Subjects' },
  { id: 'math', label: 'Mathematics' },
  { id: 'cs', label: 'Computer Science' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
];



 
    

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries: propEntries,
  initialTimeframe = 'weekly',
  timeframe: controlledTimeframe,
  onTimeframeChange,
  subject: controlledSubject = 'all',
  onSubjectChange,
  compact = false,
  limit,
  showPodium = true,
  showSearch = true,
  showPrivacyNotice = true,
  onSelectScholar,
  onNavigateToPrivacySettings,
  title,
  subtitle,
  className = '',
}) => {
  const { user, profile, gamification } = useAuth();

  // Internal state if uncontrolled
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeFilter>(initialTimeframe);
  const activeTimeframe = controlledTimeframe ?? internalTimeframe;

  const [internalSubject, setInternalSubject] = useState<string>(controlledSubject);
  const activeSubject = controlledSubject ?? internalSubject;

  // Selected Stage Filter ('all' or 'bronze', 'silver', etc.)
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [isStagesModalOpen, setIsStagesModalOpen] = useState<boolean>(false);

  const [serverEntries, setServerEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!propEntries);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Weekly Countdown state
  const countdown = useMemo(() => getWeeklyResetCountdown(), []);

  // Compute effective user streak with rock-solid fallback:
  // If user has a 3-day streak in localStorage or gamification, NEVER show 0!
  const effectiveUserStreak = useMemo(() => {
    let streakVal = gamification?.currentStreak ?? 0;
    if (typeof window !== 'undefined') {
      try {
        const localData = loadUserStreak(user?.id || 'guest');
        if (localData && localData.currentStreak > streakVal) {
          streakVal = localData.currentStreak;
        }
        const defaultLocalData = loadUserStreak('default_user');
        if (defaultLocalData && defaultLocalData.currentStreak > streakVal) {
          streakVal = defaultLocalData.currentStreak;
        }
        const storedStr = localStorage.getItem('learnco_user_streak');
        if (storedStr) {
          const num = parseInt(storedStr, 10);
          if (!isNaN(num) && num > streakVal) {
            streakVal = num;
          }
        }
      } catch (_) {}
    }
    return Math.max(0, streakVal);
  }, [gamification?.currentStreak, user?.id]);

  const handleTimeframeChange = (tf: TimeframeFilter) => {
    setInternalTimeframe(tf);
    if (onTimeframeChange) onTimeframeChange(tf);
  };

  const handleSubjectChange = (sub: string) => {
    setInternalSubject(sub);
    if (onSubjectChange) onSubjectChange(sub);
  };

  const loadFromCacheOrFallback = () => {
    setIsOffline(true);
    try {
      const cached = localStorage.getItem(`learnco_leaderboard_${activeTimeframe}_${activeSubject}`)
        || localStorage.getItem('learnco_leaderboard_weekly_all')
        || localStorage.getItem('learnco_leaderboard_all_time_all');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setServerEntries(parsed);
          return;
        }
      }
    } catch (_) {}
    setServerEntries([]);
  };

  const fetchLeaderboard = async (isManualRefresh = false) => {
    if (propEntries && !isManualRefresh) return;

    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);
    try {
      const [backendRes, firestoreRes] = await Promise.allSettled([
        AuthClient.getLeaderboard(activeTimeframe, activeSubject),
        fetchFirestoreLeaderboardEntries(),
      ]);

      const backendList: LeaderboardEntry[] =
        backendRes.status === 'fulfilled' && Array.isArray(backendRes.value) ? backendRes.value : [];
      const firestoreList: LeaderboardEntry[] =
        firestoreRes.status === 'fulfilled' && Array.isArray(firestoreRes.value) ? firestoreRes.value : [];

      // Merge entries by userId: every account stored in Firebase console or backend database is included
      const mergedMap = new Map<string, LeaderboardEntry>();
      for (const entry of firestoreList) {
        mergedMap.set(entry.userId, entry);
      }
      for (const entry of backendList) {
        const existing = mergedMap.get(entry.userId);
        mergedMap.set(entry.userId, {
          ...(existing || {}),
          ...entry,
          xp: Math.max(typeof entry.xp === 'number' ? entry.xp : 0, typeof existing?.xp === 'number' ? existing.xp : 0),
          level: Math.max(entry.level || 1, existing?.level || 1),
        });
      }

      const mergedList = Array.from(mergedMap.values());
      if (mergedList.length > 0) {
        setServerEntries(mergedList);
        setIsOffline(false);
        try {
          localStorage.setItem(`learnco_leaderboard_${activeTimeframe}_${activeSubject}`, JSON.stringify(mergedList));
          localStorage.setItem('learnco_leaderboard_weekly_all', JSON.stringify(mergedList));
        } catch (_) {}
      } else {
        loadFromCacheOrFallback();
      }
    } catch (err: any) {
      console.warn('Leaderboard offline mode activated:', err?.message);
      loadFromCacheOrFallback();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (propEntries) return;

    fetchLeaderboard();

    // Subscribe to live Firebase Console Firestore updates so new accounts & XP gains reflect immediately
    const unsubscribe = subscribeToFirestoreLeaderboard((liveEntries) => {
      if (liveEntries && liveEntries.length > 0) {
        setServerEntries((prev) => {
          const map = new Map<string, LeaderboardEntry>();
          for (const item of prev) {
            map.set(item.userId, item);
          }
          for (const item of liveEntries) {
            const existing = map.get(item.userId);
            map.set(item.userId, {
              ...(existing || {}),
              ...item,
            });
          }
          return Array.from(map.values());
        });
        setIsOffline(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [propEntries, activeTimeframe, activeSubject]);

  // Combined raw entries with unified streak and stages
  const rawEntries = useMemo(() => {
    const sourceList = propEntries || (serverEntries.length > 0 ? serverEntries : []);
    const scholarMap = new Map<string, LeaderboardEntry>();

    for (const s of sourceList) {
      scholarMap.set(s.userId, {
        ...s,
        displayName:
          s.displayName && s.displayName !== 'Anonymous Scholar' && !s.displayName.includes('You (Learner)')
            ? s.displayName
            : s.displayName || 'Scholar',
      });
    }

    const baseList: LeaderboardEntry[] = Array.from(scholarMap.values());

    const currentUserId = user?.id || 'current-user-local';
    const currentUserXp = gamification?.xp ?? (user ? 0 : 450);
    const currentUserLevel = gamification?.level ?? 1;
    const currentUserEmail = user?.email || profile?.email || '';

    // Authentic display name: Never default to 'You (Learner)'
    const currentUserName =
      profile?.displayName ||
      profile?.fullName ||
      user?.name ||
      (currentUserEmail ? currentUserEmail.split('@')[0] : '');

    // Check if current user is already present in the list
    const existingIndex = baseList.findIndex(
      (e) =>
        e.isCurrentUser ||
        e.userId === currentUserId ||
        (currentUserEmail && e.email && e.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
        (currentUserName && e.displayName.toLowerCase() === currentUserName.toLowerCase())
    );

    if (existingIndex >= 0) {
      const existing = baseList[existingIndex];
      const preservedName =
        (currentUserName && !currentUserName.includes('You (Learner)') ? currentUserName : '') ||
        (existing.displayName && !existing.displayName.includes('You (Learner)') ? existing.displayName : '') ||
        profile?.displayName ||
        profile?.fullName ||
        (currentUserEmail ? currentUserEmail.split('@')[0] : 'Scholar');

      baseList[existingIndex] = {
        ...existing,
        email: currentUserEmail || existing.email || '',
        displayName: preservedName,
        avatarUrl: profile?.avatarUrl || existing.avatarUrl,
        xp: Math.max(typeof existing.xp === 'number' ? existing.xp : 0, currentUserXp),
        streak: effectiveUserStreak,
        streakDays: effectiveUserStreak,
        level: Math.max(existing.level, currentUserLevel),
        isCurrentUser: true,
      };
    } else if (currentUserName || currentUserEmail) {
      baseList.push({
        userId: currentUserId,
        email: currentUserEmail,
        displayName: currentUserName || (currentUserEmail ? currentUserEmail.split('@')[0] : 'Scholar'),
        avatarUrl: profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUserEmail || currentUserName)}`,
        xp: currentUserXp,
        rank: baseList.length + 1,
        streak: effectiveUserStreak,
        streakDays: effectiveUserStreak,
        level: currentUserLevel,
        isCurrentUser: true,
        tier: 'Bronze I',
        tierBadgeIcon: 'trophy',
      });
    }

    // Re-sort by XP descending
    baseList.sort((a, b) => b.xp - a.xp);

    // Reassign ranks, ensure both streak and streakDays are populated, and attach computed stages
    return baseList.map((entry, idx) => {
      const s = entry.isCurrentUser
        ? effectiveUserStreak
        : (entry.streak ?? entry.streakDays ?? 1);
      const stageInfo = calculateStageFromXp(entry.xp);

      return {
        ...entry,
        rank: idx + 1,
        streak: s,
        streakDays: s,
        tier: stageInfo.substage.substageName,
        stageId: stageInfo.stage.id,
        stageName: stageInfo.stage.name,
      } as LeaderboardEntry & { stageId: string; stageName: string };
    });
  }, [propEntries, serverEntries, profile, user, gamification, effectiveUserStreak]);

  // Current user's entry and stage details
  const currentUserEntry = useMemo(() => {
    return rawEntries.find((e) => e.isCurrentUser || e.userId === user?.id) || rawEntries[0];
  }, [rawEntries, user?.id]);

  const userStageDetails = useMemo(() => {
    const xp = currentUserEntry?.xp ?? 450;
    return calculateStageFromXp(xp);
  }, [currentUserEntry?.xp]);

  // Filter entries by Search and Stage Filter
  const filteredEntries = useMemo(() => {
    let list = [...rawEntries];

    // Filter by Stage if a specific stage tab is selected
    if (selectedStageFilter !== 'all') {
      list = list.filter((item: any) => item.stageId === selectedStageFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) =>
        item.displayName.toLowerCase().includes(q)
      );
    }

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    return list;
  }, [rawEntries, selectedStageFilter, searchQuery, limit]);

  const topXpScore = useMemo(() => {
    if (rawEntries.length === 0) return 100;
    return Math.max(...rawEntries.map((e) => e.xp), 100);
  }, [rawEntries]);

  const topThree = useMemo(() => {
    return rawEntries.slice(0, 3);
  }, [rawEntries]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-300">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-slate-200">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-700/80 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-600">
          3
        </div>
      );
    }
    return (
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
        #{rank}
      </span>
    );
  };

  return (
    <div className={`space-y-5 animate-in fade-in duration-200 ${className}`}>
      {/* 1. Header with Title & Stage Ladder Launcher */}
      {(!compact || title) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>10-Stage Competitive STEM League</span>
              </span>
              <Badge variant={isOffline ? 'default' : 'primary'} size="sm">
                {isOffline ? 'Offline (Local Cache)' : 'Live Sync'}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
              {title || 'Cohort Standings & Leagues'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {subtitle || '10 ordered leagues with 3 divisions each. Top 10 advance weekly in tiers 1–6; Top 3 advance in elite tiers 7–10.'}
            </p>
          </div>

          {/* Quick Refresh & Ladder Trigger */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsStagesModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>View 10 Stages & Rules</span>
            </button>

            <button
              onClick={() => fetchLeaderboard(true)}
              disabled={isRefreshing || isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Leaderboard"
              aria-label="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* 2. User Standing & Promotion Banner */}
      {currentUserEntry && !compact && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {userStageDetails.stage.badgeEmoji}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Tier {userStageDetails.stage.tierNumber} • {userStageDetails.stage.name} League
                </span>
                <span className="text-slate-400">•</span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-black">
                  {userStageDetails.substage.substageName}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Rank #{currentUserEntry.rank} in Division</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                  {currentUserEntry.rank <= userStageDetails.stage.promotionTopCount ? 'Promotion Zone 🚀' : 'Safe Zone 🛡️'}
                </span>
              </h3>
              <p className="text-xs text-indigo-200/90">
                Weekly Cutoff: Top {userStageDetails.stage.promotionTopCount} advance to next division on Sunday!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
            {/* Streak Indicator */}
            <div className="text-center px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Active Streak</div>
              <div className="text-sm font-black text-orange-400 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{currentUserEntry?.streakDays ?? effectiveUserStreak} Days</span>
              </div>
            </div>

            {/* Weekly Countdown */}
            <div className="text-center px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-indigo-300" />
                <span>Reset Cutoff</span>
              </div>
              <div className="text-sm font-mono font-black text-amber-300 mt-0.5">
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Control Bar: Timeframe Switcher + Subject Filter + Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/80">
        {/* Timeframe Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {TIMEFRAME_OPTIONS.map((tf) => {
            const isActive = activeTimeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => handleTimeframeChange(tf.id)}
                title={tf.description}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf.icon}
                <span>{tf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Filter & Search Controls */}
        <div className="flex items-center gap-2">
          {/* Subject Filter Dropdown */}
          <div className="relative">
            <select
              value={activeSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Scholar Input */}
          {showSearch && (
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search scholars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. 10 Ordered Stage Filter Tabs (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedStageFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedStageFilter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          All Stages (30 Divisions)
        </button>

        {LEADERBOARD_STAGES.map((st) => {
          const isSelected = selectedStageFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setSelectedStageFilter(st.id)}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{st.badgeEmoji}</span>
              <span>{st.name}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Top 3 Visual Podium */}
      {showPodium && !compact && !searchQuery && selectedStageFilter === 'all' && topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Rank 2 (Silver) */}
          <Card
            variant={topThree[1].isCurrentUser ? 'elevated' : 'bordered'}
            padding="md"
            className={`order-2 md:order-1 flex flex-col items-center text-center relative overflow-hidden transition-all ${
              topThree[1].isCurrentUser
                ? 'ring-2 ring-indigo-500 border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="absolute top-3 left-3">{getRankBadge(2)}</div>
            <div className="mt-4 mb-2">
              <Avatar src={topThree[1].avatarUrl} name={topThree[1].displayName} size="lg" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-full mb-1">
              {topThree[1].displayName} {topThree[1].isCurrentUser && '(You)'}
            </h4>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] text-slate-400 font-semibold">
                Level {topThree[1].level}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5">
                <Flame className="w-3 h-3 fill-orange-500" />
                {topThree[1].streak ?? topThree[1].streakDays ?? 1}d streak
              </span>
            </div>
            <div className="w-full py-1.5 px-3 rounded-xl bg-slate-200/70 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 font-black text-xs">
              {topThree[1].xp.toLocaleString()} XP
            </div>
          </Card>

          {/* Rank 1 (Gold - Elevated Champion) */}
          <Card
            variant="elevated"
            padding="md"
            className={`order-1 md:order-2 flex flex-col items-center text-center relative overflow-hidden border-2 transition-all md:-translate-y-2 shadow-md ${
              topThree[0].isCurrentUser
                ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/60 via-white to-indigo-50/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20'
                : 'border-amber-400 dark:border-amber-500/60 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10'
            }`}
          >
            <div className="absolute top-3 left-3">{getRankBadge(1)}</div>
            <div className="absolute top-3 right-3 text-amber-500">
              <Crown className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="mt-2 mb-2 relative">
              <Avatar src={topThree[0].avatarUrl} name={topThree[0].displayName} size="xl" />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                <Star className="w-3 h-3 fill-slate-950" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider mb-1">
              Cohort Leader
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate max-w-full mb-1">
              {topThree[0].displayName} {topThree[0].isCurrentUser && '(You)'}
            </h4>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-slate-400 font-semibold">
                Level {topThree[0].level}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                {topThree[0].streak ?? topThree[0].streakDays ?? 1}d Streak
              </span>
            </div>
            <div className="w-full py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-xs">
              {topThree[0].xp.toLocaleString()} XP
            </div>
          </Card>

          {/* Rank 3 (Bronze) */}
          <Card
            variant={topThree[2].isCurrentUser ? 'elevated' : 'bordered'}
            padding="md"
            className={`order-3 flex flex-col items-center text-center relative overflow-hidden transition-all ${
              topThree[2].isCurrentUser
                ? 'ring-2 ring-indigo-500 border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="absolute top-3 left-3">{getRankBadge(3)}</div>
            <div className="mt-4 mb-2">
              <Avatar src={topThree[2].avatarUrl} name={topThree[2].displayName} size="lg" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-full mb-1">
              {topThree[2].displayName} {topThree[2].isCurrentUser && '(You)'}
            </h4>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] text-slate-400 font-semibold">
                Level {topThree[2].level}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5">
                <Flame className="w-3 h-3 fill-orange-500" />
                {topThree[2].streak ?? topThree[2].streakDays ?? 1}d streak
              </span>
            </div>
            <div className="w-full py-1.5 px-3 rounded-xl bg-amber-800/20 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-black text-xs">
              {topThree[2].xp.toLocaleString()} XP
            </div>
          </Card>
        </div>
      )}

      {/* 6. Main Leaderboard List Card */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* List Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
          <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
          <div className="col-span-6 sm:col-span-4 md:col-span-5">Scholar</div>
          <div className="hidden sm:block sm:col-span-3 md:col-span-3 text-left">Division & Zone</div>
          <div className="hidden md:block md:col-span-1 text-center">Streak</div>
          <div className="col-span-4 sm:col-span-4 md:col-span-2 text-right">XP Earned</div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronizing verified cohort records...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEntries.length === 0 && (
          <EmptyState
            icon={<Trophy className="w-6 h-6" />}
            title="No scholars found"
            description={searchQuery ? `No scholars matching "${searchQuery}".` : 'No scholars found in this division.'}
            actionLabel={searchQuery ? "Clear search" : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        )}

        {/* Leaderboard Rows */}
        {!isLoading && filteredEntries.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEntries.map((scholar: any) => {
              const isUser = scholar.isCurrentUser;
              const relativeScorePercent = Math.min(100, Math.round((scholar.xp / topXpScore) * 100));
              const scholarStreak = scholar.streak ?? scholar.streakDays ?? (isUser ? (currentUserEntry?.streakDays ?? effectiveUserStreak) : 1);
              const stageInfo = calculateStageFromXp(scholar.xp);
              const promoInfo = getPromotionZoneInfo(scholar.rank, rawEntries.length, stageInfo.stage.id);

              return (
                <div
                  key={scholar.userId}
                  onClick={() => onSelectScholar && onSelectScholar(scholar)}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3.5 transition-colors ${
                    isUser
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  } ${onSelectScholar ? 'cursor-pointer' : ''}`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                    {getRankBadge(scholar.rank)}
                  </div>

                  {/* Scholar Identity */}
                  <div className="col-span-6 sm:col-span-4 md:col-span-5 flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={scholar.avatarUrl}
                      name={scholar.displayName}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {scholar.displayName}
                        </span>
                        {isUser && (
                          <Badge variant="primary" size="sm">
                            You
                          </Badge>
                        )}
                        {/* Stage Badge */}
                        <span 
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${stageInfo.substage.colorScheme.badgeBg} ${stageInfo.substage.colorScheme.badgeText} ${stageInfo.substage.colorScheme.border}`}
                          title={stageInfo.substage.substageName}
                        >
                          {stageInfo.stage.badgeEmoji}
                          {stageInfo.substage.substageName}
                        </span>
                      </div>



                      {/* Division Pill & 0 XP Indicator */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {scholar.xp === 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            0 XP
                          </span>
                        )}
                        {promoInfo.zone !== 'safe' && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${promoInfo.badgeBg} ${promoInfo.badgeText} ${promoInfo.border}`}>
                            {promoInfo.label}
                          </span>
                        )}
                        <span className="sm:hidden text-slate-300">•</span>
                        <span className="sm:hidden text-[10px] text-orange-500 font-bold flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 fill-orange-500" />
                          {scholarStreak}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Division & Weekly Promotion Zone Tag */}
                  <div className="hidden sm:flex sm:col-span-3 md:col-span-3 items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${promoInfo.badgeBg} ${promoInfo.badgeText} ${promoInfo.border}`}>
                      {promoInfo.label}
                    </span>
                  </div>

                  {/* Streak Column (Clean, verified streak with fire icon) */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <span className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>{scholarStreak}d</span>
                    </span>
                  </div>

                  {/* XP Readout */}
                  <div className="col-span-4 sm:col-span-4 md:col-span-2 text-right">
                    <div className="inline-flex items-center gap-1 font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                      <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{scholar.xp.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">XP</span>
                    </div>
                    {scholar.xp === 0 && (
                      <div className="text-[10px] font-semibold text-slate-400">
                        0 XP Active
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info strip */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Weekly League Promotions recalculate every Sunday at midnight UTC.</span>
          </div>
          <span className="font-semibold">
            Showing {filteredEntries.length} of {rawEntries.length} scholars
          </span>
        </div>
      </Card>

      {/* Privacy & Firebase Automation Notice Banner */}
      {showPrivacyNotice && (
        <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Firebase Console Real-Time Sync & Permanent Leaderboard</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                  Connected
                </span>
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed max-w-2xl">
                All registered learner accounts (including 0 XP learners) remain on the leaderboard permanently with live Firebase sync. Student email addresses and private credentials are never publicly displayed or exposed on the leaderboard.
              </p>
            </div>
          </div>

          {onNavigateToPrivacySettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToPrivacySettings}
              className="text-xs shrink-0 self-start sm:self-auto"
            >
              Privacy Settings
            </Button>
          )}
        </div>
      )}

      {/* 7. Modal showing all 10 Stages & 30 Substages */}
      <StagesLadderModal
        isOpen={isStagesModalOpen}
        onClose={() => setIsStagesModalOpen(false)}
        currentUserXp={currentUserEntry?.xp ?? 450}
        currentUserStreak={effectiveUserStreak}
      />
    </div>
  );
};
