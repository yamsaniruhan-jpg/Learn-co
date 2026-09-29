import { calculateLevelFromXp, UserGamification } from '../types/auth';

const XP_STORAGE_KEY = 'learnco_user_xp';
const XP_LOG_KEY = 'learnco_xp_transactions_log';

export interface XpEventDetail {
  amount: number;
  reason: string;
  totalXp: number;
  level: number;
}

/**
 * Get current user XP from localStorage with safe default
 */
export function getCurrentXp(defaultXp: number = 420): number {
  try {
    const saved = localStorage.getItem(XP_STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (_) {}
  return defaultXp;
}

/**
 * Award XP to learner, persist in localStorage, and dispatch global window event
 */
export function awardXp(
  amount: number,
  reason: string = 'Completed Activity'
): { newTotal: number; levelInfo: ReturnType<typeof calculateLevelFromXp> } {
  const current = getCurrentXp();
  const safeAmount = Math.max(0, amount);
  const newTotal = current + safeAmount;

  try {
    localStorage.setItem(XP_STORAGE_KEY, newTotal.toString());
    
    // Save transaction log
    const rawLogs = localStorage.getItem(XP_LOG_KEY);
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    logs.unshift({
      id: `xp-tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amount: safeAmount,
      reason,
      timestamp: new Date().toISOString(),
      balanceAfter: newTotal,
    });
    // Keep last 50 logs
    localStorage.setItem(XP_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (_) {}

  const levelInfo = calculateLevelFromXp(newTotal);

  try {
    const event = new CustomEvent<XpEventDetail>('learnco_xp_awarded', {
      detail: {
        amount: safeAmount,
        reason,
        totalXp: newTotal,
        level: levelInfo.level,
      },
    });
    window.dispatchEvent(event);
  } catch (_) {}

  return { newTotal, levelInfo };
}

/**
 * Set user XP directly (e.g. from backend sync)
 */
export function setGlobalXp(newTotal: number): void {
  try {
    localStorage.setItem(XP_STORAGE_KEY, Math.max(0, newTotal).toString());
    const levelInfo = calculateLevelFromXp(newTotal);
    window.dispatchEvent(
      new CustomEvent<XpEventDetail>('learnco_xp_awarded', {
        detail: {
          amount: 0,
          reason: 'Sync',
          totalXp: newTotal,
          level: levelInfo.level,
        },
      })
    );
  } catch (_) {}
}
