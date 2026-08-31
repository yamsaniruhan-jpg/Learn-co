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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthClient } from '../../services/authClient';
import { LeaderboardEntry, TimeframeFilter } from '../../types/auth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Progress } from '../ui/Progress';
import { EmptyState } from '../ui/EmptyState';

export interface LeaderboardProps {
  /** Optional pre-fetched leaderboard entries. If omitted, will fetch from server. */
  entries?: LeaderboardEntry[];
  /** Default or controlled timeframe */
  initialTimeframe?: TimeframeFilter;
  /** Active timeframe when controlled */
  timeframe?: TimeframeFilter;
  /** Callback fired when timeframe tab changes */
  onTimeframeChange?: (timeframe: TimeframeFilter) => void;
  /** Initial or controlled subject filter (e.g. 'all', 'math', 'cs', 'physics', 'chemistry', 'biology') */
  subject?: string;
  /** Callback fired when subject filter changes */
  onSubjectChange?: (subject: string) => void;
  /** Compact mode suitable for dashboard widgets or sidebars */
  compact?: boolean;
  /** Limit the number of visible rows */
  limit?: number;
  /** Whether to render top-3 visual podium cards above the list */
  showPodium?: boolean;
  /** Whether to show the search input */
  showSearch?: boolean;
  /** Whether to show the privacy guarantee banner */
  showPrivacyNotice?: boolean;
  /** Callback when a user clicks on a scholar in the list */
  onSelectScholar?: (scholar: LeaderboardEntry) => void;
  /** Callback to navigate to settings/privacy tab */
  onNavigateToPrivacySettings?: () => void;
  /** Custom title override */
  title?: string;
  /** Custom subtitle override */
  subtitle?: string;
  /** Extra CSS classes */
  className?: string;
}

const TIMEFRAME_OPTIONS: { id: TimeframeFilter; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'daily', label: 'Today', description: 'XP gained from today\'s practice sessions', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'weekly', label: 'This Week', description: 'Weekly cohort sprint rankings', icon: <TrendingUp className="w-3.5 h-3.5" /> },
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
  initialTimeframe = 'all_time',
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

  const [serverEntries, setServerEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!propEntries);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleTimeframeChange = (tf: TimeframeFilter) => {
    setInternalTimeframe(tf);
    if (onTimeframeChange) onTimeframeChange(tf);
  };

  const handleSubjectChange = (sub: string) => {
    setInternalSubject(sub);
    if (onSubjectChange) onSubjectChange(sub);
  };

  // Fetch from server when uncontrolled entries or when filters change
  const fetchLeaderboard = async (isManualRefresh = false) => {
    if (propEntries && !isManualRefresh) return;

    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);
    try {
      const data = await AuthClient.getLeaderboard(activeTimeframe, activeSubject);
      setServerEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!propEntries) {
      fetchLeaderboard();
    }
  }, [propEntries, activeTimeframe, activeSubject]);

  // Use provided entries or server-fetched entries
  const rawEntries = propEntries || serverEntries;

  // Filter by search query
  const filteredEntries = useMemo(() => {
    let list = [...rawEntries];

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
  }, [rawEntries, searchQuery, limit]);

  // Identify current user entry and top score for proportional progression
  const currentUserEntry = useMemo(() => {
    return rawEntries.find((e) => e.isCurrentUser || e.userId === user?.id);
  }, [rawEntries, user?.id]);

  const topXpScore = useMemo(() => {
    if (rawEntries.length === 0) return 100;
    return Math.max(...rawEntries.map((e) => e.xp), 100);
  }, [rawEntries]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return rawEntries.slice(0, 3);
  }, [rawEntries]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs border border-amber-300">
          <Crown className="w-3.5 h-3.5 fill-slate-950" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-800 dark:text-slate-100 font-black text-xs flex items-center justify-center shadow-xs border border-slate-300 dark:border-slate-500">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-amber-800 text-amber-100 font-black text-xs flex items-center justify-center shadow-xs border border-amber-600">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
        #{rank}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Component Header (when not in compact mode or custom title provided) */}
      {(!compact || title) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Authoritative XP Leaderboard</span>
              </span>
              <Badge variant="primary" size="sm">
                Live Sync
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
              {title || 'Cohort Standings & Rankings'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {subtitle || 'Real-time ranking powered by verified practice answers, streak consistency, and concept mastery.'}
            </p>
          </div>

          {/* Quick Refresh & User Standing Capsule */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentUserEntry && (
              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2 shadow-xs">
                <span>Your Standing:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  #{currentUserEntry.rank} ({currentUserEntry.xp} XP)
                </span>
              </div>
            )}

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

      {/* Control Bar: Timeframe Switcher + Subject Filter + Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/80">
        {/* Timeframe Tabs (Daily / Weekly / Monthly / All-Time) */}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scholars..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Visual Podium (rendered if enabled, not compact, and search is empty) */}
      {showPodium && !compact && !searchQuery && topThree.length >= 3 && (
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
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-full">
              {topThree[1].displayName} {topThree[1].isCurrentUser && '(You)'}
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold mb-3">
              Level {topThree[1].level} • {topThree[1].streak}d streak
            </span>
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
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate max-w-full">
              {topThree[0].displayName} {topThree[0].isCurrentUser && '(You)'}
            </h4>
            <span className="text-xs text-slate-400 font-semibold mb-3">
              Level {topThree[0].level} Master • 🔥 {topThree[0].streak}d Streak
            </span>
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
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-full">
              {topThree[2].displayName} {topThree[2].isCurrentUser && '(You)'}
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold mb-3">
              Level {topThree[2].level} • {topThree[2].streak}d streak
            </span>
            <div className="w-full py-1.5 px-3 rounded-xl bg-amber-800/20 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-black text-xs">
              {topThree[2].xp.toLocaleString()} XP
            </div>
          </Card>
        </div>
      )}

      {/* Main Leaderboard List Card */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* List Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
          <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
          <div className="col-span-6 sm:col-span-5 md:col-span-6">Scholar</div>
          <div className="hidden sm:block sm:col-span-3 md:col-span-3 text-left">Mastery & Streak</div>
          <div className="col-span-4 sm:col-span-3 md:col-span-2 text-right">XP Earned</div>
        </div>

        {/* List Body */}
        {isLoading ? (
          <div className="py-12 px-4 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">
              Synchronizing verified leaderboard scores...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-rose-500 font-semibold">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchLeaderboard(true)}>
              Retry Connection
            </Button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No Scholars Found"
              description={
                searchQuery
                  ? `No scholars match the search "${searchQuery}".`
                  : 'No leaderboard entries are currently recorded for this timeframe.'
              }
              actionLabel={searchQuery ? 'Clear Search' : undefined}
              onAction={searchQuery ? () => setSearchQuery('') : undefined}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEntries.map((scholar) => {
              const isUser = scholar.isCurrentUser || scholar.userId === user?.id;
              const relativeScorePercent = Math.min(100, Math.max(8, Math.round((scholar.xp / topXpScore) * 100)));

              return (
                <div
                  key={scholar.userId}
                  onClick={() => onSelectScholar && onSelectScholar(scholar)}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3.5 transition-all ${
                    onSelectScholar ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : ''
                  } ${
                    isUser
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-l-4 border-indigo-600 dark:border-indigo-400'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    {getRankBadge(scholar.rank)}
                  </div>

                  {/* Scholar Identity (Avatar + Name) */}
                  <div className="col-span-6 sm:col-span-5 md:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                    <Avatar
                      src={scholar.avatarUrl}
                      name={scholar.displayName}
                      size="sm"
                      className="shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold truncate ${
                          isUser ? 'text-indigo-900 dark:text-indigo-100 font-extrabold' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {scholar.displayName}
                        </span>

                        {isUser && (
                          <Badge variant="primary" size="sm">
                            You
                          </Badge>
                        )}
                      </div>

                      {/* Progress bar visualizing relative XP strength */}
                      <div className="w-full max-w-[140px] h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            scholar.rank === 1
                              ? 'bg-amber-500'
                              : scholar.rank === 2
                              ? 'bg-slate-400'
                              : scholar.rank === 3
                              ? 'bg-amber-700'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${relativeScorePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Level & Streak */}
                  <div className="hidden sm:flex sm:col-span-3 md:col-span-3 items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Level {scholar.level}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-semibold text-orange-500 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-orange-500" />
                      <span>{scholar.streak}d streak</span>
                    </span>
                  </div>

                  {/* XP Readout */}
                  <div className="col-span-4 sm:col-span-3 md:col-span-2 text-right">
                    <div className="inline-flex items-center gap-1 font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                      <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{scholar.xp.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">XP</span>
                    </div>
                    {/* Mobile streak indicator */}
                    <div className="sm:hidden text-[10px] text-orange-500 flex items-center justify-end gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-orange-500" />
                      <span>{scholar.streak}d</span>
                    </div>
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
            <span>Anti-cheat verification active: XP is cryptographically minted via server evaluation.</span>
          </div>
          <span className="font-semibold">
            Showing {filteredEntries.length} of {rawEntries.length} scholars
          </span>
        </div>
      </Card>

      {/* Privacy Notice Banner (ensuring private data is kept hidden) */}
      {showPrivacyNotice && (
        <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 sm:mt-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                Privacy Protection Policy
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed max-w-2xl">
                Only public handles, levels, streaks, and verified XP are displayed. Private data (email addresses, phone numbers, individual question errors, test target scores, and auth tokens) is strictly protected and never published to cohort leaderboards.
              </p>
            </div>
          </div>

          {onNavigateToPrivacySettings && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToPrivacySettings}
              className="shrink-0 text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Privacy Settings
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
