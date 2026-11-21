/**
 * Streak Calculation & Persistence Utility for Gamification System
 * 
 * Handles calculating, updating, validating, and persisting daily learning streak data
 * across browser sessions, user sign-in events, and calendar day boundaries.
 * 
 * Core Streak Rules:
 * 1. If a person signs in / uses the app today for the first time: streak starts at 1 today.
 * 2. If the person signs in tomorrow again (difference = 1 day): streak continues (increments by 1).
 * 3. If the person signs in multiple times on the same day (difference = 0): streak maintains current count.
 * 4. If the difference between last active day and today is > 1 day: streak breaks and restarts at 1 today.
 */

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date string: YYYY-MM-DD
  streakHistory: string[]; // List of unique YYYY-MM-DD dates with recorded activity
  dailyActivities: {
    [dateKey: string]: {
      questionsSolved: number;
      xpEarned: number;
      minutesStudied: number;
      sessionsCompleted: number;
    };
  };
  freezeDaysRemaining?: number;
  isStreakActiveToday: boolean;
  streakStatus: 'ACTIVE_TODAY' | 'AT_RISK' | 'EXTENDED' | 'BROKEN';
}

export interface ActivityPayload {
  questionsSolved?: number;
  xpEarned?: number;
  minutesStudied?: number;
  sessionsCompleted?: number;
  timestamp?: Date | string;
}

const STORAGE_KEY_PREFIX = 'learnco_streak_data_';
const DEFAULT_USER_ID = 'default_user';

/**
 * Format a Date object to standard YYYY-MM-DD key format in local timezone
 */
export function formatDateToDateKey(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    const year = fallback.getFullYear();
    const month = String(fallback.getMonth() + 1).padStart(2, '0');
    const day = String(fallback.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in whole calendar days between two YYYY-MM-DD strings
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
}

/**
 * Get initial default streak state
 */
export function getDefaultStreakData(initialStreak = 1, longestStreak = 1): StreakData {
  const today = formatDateToDateKey();
  const history: string[] = [today];

  const dailyActivities: StreakData['dailyActivities'] = {
    [today]: {
      questionsSolved: 0,
      xpEarned: 0,
      minutesStudied: 0,
      sessionsCompleted: 0,
    },
  };

  return {
    currentStreak: Math.max(1, initialStreak),
    longestStreak: Math.max(1, longestStreak, initialStreak),
    lastActiveDate: today,
    streakHistory: history,
    dailyActivities,
    freezeDaysRemaining: 1,
    isStreakActiveToday: true,
    streakStatus: 'ACTIVE_TODAY',
  };
}

/**
 * Load persisted streak data for a user with safety fallbacks
 */
export function loadUserStreak(userId: string = DEFAULT_USER_ID): StreakData {
  if (typeof window === 'undefined') {
    return getDefaultStreakData(1, 1);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) {
      const initial = getDefaultStreakData(1, 1);
      saveUserStreak(userId, initial);
      return initial;
    }

    const parsed: StreakData = JSON.parse(raw);
    return computeCurrentStreakStatus(parsed, userId);
  } catch (e) {
    console.warn('Failed to load streak from localStorage, using default', e);
    return getDefaultStreakData(1, 1);
  }
}

/**
 * Persist streak data to localStorage
 */
export function saveUserStreak(userId: string = DEFAULT_USER_ID, streakData: StreakData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(streakData));
  } catch (e) {
    console.error('Failed to persist streak data', e);
  }
}

/**
 * Re-evaluates and synchronizes streak status on user session/sign-in against today's date:
 * - If signed in today for the first time: streak starts today (1 day).
 * - If signed in yesterday and opens today: streak continues (increments by 1).
 * - If signed in today again: maintains current streak.
 * - If missed more than 1 day (gap > 1 day): breaks streak and restarts at 1 today.
 */
export function computeCurrentStreakStatus(streakData: StreakData, userId: string = DEFAULT_USER_ID): StreakData {
  const today = formatDateToDateKey();
  const lastActive = streakData.lastActiveDate;

  if (!lastActive) {
    const freshData: StreakData = {
      ...streakData,
      currentStreak: 1,
      longestStreak: Math.max(1, streakData.longestStreak || 1),
      lastActiveDate: today,
      isStreakActiveToday: true,
      streakStatus: 'ACTIVE_TODAY',
      streakHistory: [today],
    };
    saveUserStreak(userId, freshData);
    return freshData;
  }

  const daysDiff = getDaysDifference(lastActive, today);

  if (daysDiff === 0) {
    // Already active today
    const updated: StreakData = {
      ...streakData,
      currentStreak: Math.max(1, streakData.currentStreak || 1),
      isStreakActiveToday: true,
      streakStatus: 'ACTIVE_TODAY',
    };
    return updated;
  } else if (daysDiff === 1) {
    // User was active yesterday and signed in today -> Streak continues!
    const newStreak = (streakData.currentStreak || 0) + 1;
    const historySet = new Set(streakData.streakHistory || []);
    historySet.add(today);
    
    const updated: StreakData = {
      ...streakData,
      currentStreak: newStreak,
      longestStreak: Math.max(streakData.longestStreak || 0, newStreak),
      lastActiveDate: today,
      isStreakActiveToday: true,
      streakStatus: 'EXTENDED',
      streakHistory: Array.from(historySet).sort(),
    };
    saveUserStreak(userId, updated);
    return updated;
  } else if (daysDiff > 1) {
    // User missed one or more whole calendar days -> Break streak and start fresh today!
    const historySet = new Set(streakData.streakHistory || []);
    historySet.add(today);

    const updated: StreakData = {
      ...streakData,
      currentStreak: 1,
      longestStreak: Math.max(streakData.longestStreak || 1, 1),
      lastActiveDate: today,
      isStreakActiveToday: true,
      streakStatus: 'ACTIVE_TODAY',
      streakHistory: Array.from(historySet).sort(),
    };
    saveUserStreak(userId, updated);
    return updated;
  }

  return streakData;
}

/**
 * Record a new qualifying daily activity (solving practice questions, completing lessons, etc.)
 */
export function recordDailyActivity(
  userId: string = DEFAULT_USER_ID,
  activity: ActivityPayload = {}
): StreakData {
  const currentData = loadUserStreak(userId);
  const today = formatDateToDateKey(activity.timestamp || new Date());
  const lastActive = currentData.lastActiveDate;

  let newCurrentStreak = currentData.currentStreak;
  let status: StreakData['streakStatus'] = 'ACTIVE_TODAY';

  if (!lastActive) {
    newCurrentStreak = 1;
    status = 'ACTIVE_TODAY';
  } else {
    const daysDiff = getDaysDifference(lastActive, today);

    if (daysDiff === 0) {
      newCurrentStreak = Math.max(1, currentData.currentStreak);
      status = 'ACTIVE_TODAY';
    } else if (daysDiff === 1) {
      newCurrentStreak = (currentData.currentStreak || 0) + 1;
      status = 'EXTENDED';
    } else {
      newCurrentStreak = 1;
      status = 'ACTIVE_TODAY';
    }
  }

  const newLongestStreak = Math.max(currentData.longestStreak || 1, newCurrentStreak);

  // Update streak history list
  const historySet = new Set(currentData.streakHistory || []);
  historySet.add(today);
  const updatedHistory = Array.from(historySet).sort();

  // Aggregate daily activities
  const existingDayActivity = currentData.dailyActivities?.[today] || {
    questionsSolved: 0,
    xpEarned: 0,
    minutesStudied: 0,
    sessionsCompleted: 0,
  };

  const updatedDailyActivities = {
    ...(currentData.dailyActivities || {}),
    [today]: {
      questionsSolved: existingDayActivity.questionsSolved + (activity.questionsSolved || 0),
      xpEarned: existingDayActivity.xpEarned + (activity.xpEarned || 0),
      minutesStudied: existingDayActivity.minutesStudied + (activity.minutesStudied || 0),
      sessionsCompleted: existingDayActivity.sessionsCompleted + (activity.sessionsCompleted || 0),
    },
  };

  const updatedStreakData: StreakData = {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: today,
    streakHistory: updatedHistory,
    dailyActivities: updatedDailyActivities,
    freezeDaysRemaining: currentData.freezeDaysRemaining ?? 1,
    isStreakActiveToday: true,
    streakStatus: status,
  };

  saveUserStreak(userId, updatedStreakData);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('learnco_streak_updated', { detail: updatedStreakData }));
    } catch {
      // ignore CustomEvent dispatch errors in restricted environments
    }
  }
  return updatedStreakData;
}

/** Sum activity actually recorded on this device over the last seven local days. */
export function getRecentStudyMinutes(streakData: StreakData, now: Date = new Date()): number {
  const dates = new Set<string>();
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    dates.add(formatDateToDateKey(date));
  }
  return Object.entries(streakData.dailyActivities || {}).reduce((total, [date, activity]) => {
    const minutes = activity?.minutesStudied;
    return dates.has(date) && typeof minutes === 'number' && Number.isFinite(minutes)
      ? total + Math.max(0, minutes) : total;
  }, 0);
}

/**
 * Returns streak summary for the last 7 calendar days to render visual streak day pills
 */
export function getWeeklyStreakPills(streakData: StreakData): { dayName: string; dateKey: string; isCompleted: boolean; isToday: boolean }[] {
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const todayKey = formatDateToDateKey(today);
  const result = [];

  const historySet = new Set(streakData.streakHistory || []);

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateKey = formatDateToDateKey(d);
    const dayName = daysShort[d.getDay()];
    const isCompleted = historySet.has(dateKey);
    const isToday = dateKey === todayKey;

    result.push({
      dayName,
      dateKey,
      isCompleted,
      isToday,
    });
  }

  return result;
}

export interface StreakHeatmapDay {
  dateKey: string;
  dayLabel: string;
  monthLabel: string;
  dayOfWeek: number;
  isActive: boolean;
  isToday: boolean;
  intensity: 0 | 1 | 2 | 3 | 4;
  questionsSolved: number;
  xpEarned: number;
  minutesStudied: number;
  sessionsCompleted: number;
}

export interface StreakMilestoneInfo {
  current: number;
  longest: number;
  nextMilestone: number;
  previousMilestone: number;
  progressPercent: number;
  earnedMilestones: number[];
  allMilestones: number[];
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

/**
 * Build an 84-day (12-week) activity heatmap ordered chronologically from oldest -> today.
 */
export function getStreakHeatmapDays(
  streakData: StreakData,
  daysCount: number = 84,
  now: Date = new Date()
): StreakHeatmapDay[] {
  const count = Math.max(7, Math.min(365, Math.floor(daysCount)));
  const todayKey = formatDateToDateKey(now);
  const historySet = new Set(streakData.streakHistory || []);
  const activities = streakData.dailyActivities || {};
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const result: StreakHeatmapDay[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = formatDateToDateKey(d);
    const dayAct = activities[dateKey] || {
      questionsSolved: 0,
      xpEarned: 0,
      minutesStudied: 0,
      sessionsCompleted: 0,
    };

    const questionsSolved = Math.max(0, Number(dayAct.questionsSolved || 0));
    const xpEarned = Math.max(0, Number(dayAct.xpEarned || 0));
    const minutesStudied = Math.max(0, Number(dayAct.minutesStudied || 0));
    const sessionsCompleted = Math.max(0, Number(dayAct.sessionsCompleted || 0));

    const activityScore =
      questionsSolved * 3 +
      Math.round(xpEarned / 5) +
      Math.round(minutesStudied / 4) +
      sessionsCompleted * 4;
    const isActive =
      historySet.has(dateKey) ||
      questionsSolved > 0 ||
      xpEarned > 0 ||
      minutesStudied > 0 ||
      sessionsCompleted > 0;

    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (isActive) {
      if (activityScore >= 40) intensity = 4;
      else if (activityScore >= 20) intensity = 3;
      else if (activityScore >= 6) intensity = 2;
      else intensity = 1;
    }

    result.push({
      dateKey,
      dayLabel: `${daysShort[d.getDay()]}, ${monthsShort[d.getMonth()]} ${d.getDate()}`,
      monthLabel: monthsShort[d.getMonth()],
      dayOfWeek: d.getDay(),
      isActive,
      isToday: dateKey === todayKey,
      intensity,
      questionsSolved,
      xpEarned,
      minutesStudied,
      sessionsCompleted,
    });
  }

  return result;
}

/**
 * Compute earned milestones and progress toward the next streak milestone.
 */
export function getStreakMilestoneInfo(streakData: StreakData): StreakMilestoneInfo {
  const current = Math.max(0, Number(streakData.currentStreak || 0));
  const longest = Math.max(current, Number(streakData.longestStreak || 0));
  const earnedMilestones = STREAK_MILESTONES.filter((m) => longest >= m);
  const nextMilestone = STREAK_MILESTONES.find((m) => current < m) ?? 365;
  const previousMilestone = [...STREAK_MILESTONES].reverse().find((m) => current >= m) ?? 0;
  const span = Math.max(1, nextMilestone - previousMilestone);
  const progressPercent =
    current >= nextMilestone
      ? 100
      : Math.min(100, Math.max(0, Math.round(((current - previousMilestone) / span) * 100)));

  return {
    current,
    longest,
    nextMilestone,
    previousMilestone,
    progressPercent,
    earnedMilestones,
    allMilestones: [...STREAK_MILESTONES],
  };
}

/**
 * Merge local device streak telemetry with remote Firestore streak summary cleanly.
 */
export function mergeStreakData(
  local: StreakData,
  remote: Partial<StreakData> | null | undefined,
  now: Date = new Date()
): StreakData {
  if (!remote) return local;

  const historySet = new Set<string>([
    ...(Array.isArray(local.streakHistory) ? local.streakHistory : []),
    ...(Array.isArray(remote.streakHistory) ? remote.streakHistory : []),
  ].filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)));

  const mergedDaily: StreakData['dailyActivities'] = {};
  const allDates = new Set<string>([
    ...Object.keys(local.dailyActivities || {}),
    ...Object.keys(remote.dailyActivities || {}),
  ]);

  for (const dateKey of allDates) {
    const l = local.dailyActivities?.[dateKey];
    const r = remote.dailyActivities?.[dateKey];
    mergedDaily[dateKey] = {
      questionsSolved: Math.max(Number(l?.questionsSolved || 0), Number(r?.questionsSolved || 0)),
      xpEarned: Math.max(Number(l?.xpEarned || 0), Number(r?.xpEarned || 0)),
      minutesStudied: Math.max(Number(l?.minutesStudied || 0), Number(r?.minutesStudied || 0)),
      sessionsCompleted: Math.max(Number(l?.sessionsCompleted || 0), Number(r?.sessionsCompleted || 0)),
    };
  }

  const todayKey = formatDateToDateKey(now);
  historySet.add(todayKey);
  const sortedHistory = Array.from(historySet).sort();

  // Compute contiguous streak backwards from today
  let contiguous = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const key = formatDateToDateKey(d);
    if (historySet.has(key)) {
      contiguous += 1;
    } else {
      break;
    }
  }

  const currentStreak = Math.max(
    1,
    contiguous,
    local.lastActiveDate === todayKey ? Number(local.currentStreak || 1) : 1,
    remote.lastActiveDate === todayKey ? Number(remote.currentStreak || 1) : 1
  );

  const longestStreak = Math.max(
    currentStreak,
    Number(local.longestStreak || 1),
    Number(remote.longestStreak || 1)
  );

  const freezeDaysRemaining = Math.max(
    Number(local.freezeDaysRemaining ?? 1),
    Number(remote.freezeDaysRemaining ?? 1)
  );

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: todayKey,
    streakHistory: sortedHistory,
    dailyActivities: mergedDaily,
    freezeDaysRemaining,
    isStreakActiveToday: true,
    streakStatus: currentStreak > 1 ? 'EXTENDED' : 'ACTIVE_TODAY',
  };
}

