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
