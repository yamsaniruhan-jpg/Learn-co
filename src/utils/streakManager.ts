/**
 * Streak Calculation & Persistence Utility for Gamification System
 * 
 * Handles calculating, updating, validating, and persisting daily learning streak data
 * across browser sessions, user activity events, and calendar day boundaries.
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
 * Format a Date object to standard YYYY-MM-DD key format in the target or local timezone
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
export function getDefaultStreakData(initialStreak = 0, longestStreak = 0): StreakData {
  const today = formatDateToDateKey();
  const history: string[] = [];
  
  if (initialStreak > 0) {
    // Seed past days if a positive initial streak was specified
    for (let i = initialStreak - 1; i >= 0; i--) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);
      history.push(formatDateToDateKey(pastDate));
    }
  }

  const dailyActivities: StreakData['dailyActivities'] = {};
  history.forEach((dKey) => {
    dailyActivities[dKey] = {
      questionsSolved: 4,
      xpEarned: 20,
      minutesStudied: 25,
      sessionsCompleted: 1,
    };
  });

  return {
    currentStreak: initialStreak,
    longestStreak: Math.max(longestStreak, initialStreak),
    lastActiveDate: initialStreak > 0 ? today : '',
    streakHistory: history,
    dailyActivities,
    freezeDaysRemaining: 1,
    isStreakActiveToday: initialStreak > 0,
    streakStatus: initialStreak > 0 ? 'ACTIVE_TODAY' : 'BROKEN',
  };
}

/**
 * Load persisted streak data for a user with safety fallbacks
 */
export function loadUserStreak(userId: string = DEFAULT_USER_ID, initialFallbackStreak = 0): StreakData {
  if (typeof window === 'undefined') {
    return getDefaultStreakData(initialFallbackStreak, initialFallbackStreak);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) {
      const initial = getDefaultStreakData(initialFallbackStreak, initialFallbackStreak);
      saveUserStreak(userId, initial);
      return initial;
    }

    const parsed: StreakData = JSON.parse(raw);
    return computeCurrentStreakStatus(parsed);
  } catch (e) {
    console.warn('Failed to load streak from localStorage, using default', e);
    return getDefaultStreakData(initialFallbackStreak);
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
 * Re-evaluates streak status against the current date (e.g. checks if day passed without activity)
 */
export function computeCurrentStreakStatus(streakData: StreakData): StreakData {
  const today = formatDateToDateKey();
  const lastActive = streakData.lastActiveDate;

  if (!lastActive) {
    return {
      ...streakData,
      isStreakActiveToday: false,
      streakStatus: 'AT_RISK',
    };
  }

  const daysDiff = getDaysDifference(lastActive, today);

  if (daysDiff === 0) {
    // Activity happened today
    return {
      ...streakData,
      isStreakActiveToday: true,
      streakStatus: 'ACTIVE_TODAY',
    };
  } else if (daysDiff === 1) {
    // Activity happened yesterday, today's practice has not occurred yet
    return {
      ...streakData,
      isStreakActiveToday: false,
      streakStatus: 'AT_RISK',
    };
  } else {
    // Missed 2 or more days
    return {
      ...streakData,
      currentStreak: 0,
      isStreakActiveToday: false,
      streakStatus: 'BROKEN',
    };
  }
}

/**
 * Record a new qualifying daily activity and recalculate the streak.
 * 
 * Rules:
 * - Activity today when already active today: aggregates activity stats, maintains streak.
 * - Activity today when last active yesterday (daysDiff === 1): increments streak (+1), updates longest streak if exceeded.
 * - Activity today when last active > 1 day ago: resets current streak to 1, begins new streak.
 * - First activity ever: sets streak to 1.
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
    status = 'EXTENDED';
  } else {
    const daysDiff = getDaysDifference(lastActive, today);

    if (daysDiff === 0) {
      // Already active today; keep current streak count
      newCurrentStreak = Math.max(1, currentData.currentStreak);
      status = 'ACTIVE_TODAY';
    } else if (daysDiff === 1) {
      // Consecutive active day! Increment streak
      newCurrentStreak = currentData.currentStreak + 1;
      status = 'EXTENDED';
    } else {
      // Missed one or more days; start fresh streak of 1
      newCurrentStreak = 1;
      status = 'EXTENDED';
    }
  }

  const newLongestStreak = Math.max(currentData.longestStreak, newCurrentStreak);

  // Update streak history list if not already present
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
  return updatedStreakData;
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
