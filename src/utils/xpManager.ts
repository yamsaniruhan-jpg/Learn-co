import { calculateLevelFromXp } from '../types/auth';

// Legacy unscoped learnco_user_xp and learnco_xp_transactions_log are left
// untouched. Their owner and server/local split are unknown, so automatically
// attributing them to the next person to sign in would mix accounts.
const STORAGE_PREFIX = 'learnco_xp_v2';

type AccountId = string | null | undefined;

function accountScope(accountId?: AccountId): string {
  if (accountId === null) return 'guest';
  if (typeof accountId === 'string' && accountId) return `account:${encodeURIComponent(accountId)}`;
  try {
    if (localStorage.getItem('learnco_auth_token')) {
      const user = JSON.parse(localStorage.getItem('learnco_user') || 'null');
      if (typeof user?.id === 'string' && user.id) return `account:${encodeURIComponent(user.id)}`;
    }
  } catch { /* Use a separate guest scope if storage is unavailable. */ }
  return 'guest';
}

function keyFor(scope: string, field: 'server' | 'activity' | 'log'): string {
  return `${STORAGE_PREFIX}:${scope}:${field}`;
}

function readPoints(scope: string, field: 'server' | 'activity'): number {
  try {
    const raw = localStorage.getItem(keyFor(scope, field));
    if (raw === null || !/^\d+$/.test(raw)) return 0;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

function safePoints(value: number): number {
  return Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(value))) : 0;
}

export interface XpEventDetail {
  amount: number;
  reason: string;
  totalXp: number;
  level: number;
}

/** Total displayed on this device: server practice XP plus device-only activity points. */
export function getCurrentXp(defaultXp: number = 0, accountId?: AccountId): number {
  try {
    const scope = accountScope(accountId);
    const server = localStorage.getItem(keyFor(scope, 'server'));
    const activity = localStorage.getItem(keyFor(scope, 'activity'));
    if (server === null && activity === null) return safePoints(defaultXp);
    return Math.min(Number.MAX_SAFE_INTEGER, readPoints(scope, 'server') + readPoints(scope, 'activity'));
  } catch { return safePoints(defaultXp); }
}

/** Store the latest server practice XP without discarding device-only activity. */
export function syncLocalXpOnly(xp: number, accountId?: AccountId): number {
  const safeXp = safePoints(xp);
  const scope = accountScope(accountId);
  const localXp = readPoints(scope, 'activity');
  try { localStorage.setItem(keyFor(scope, 'server'), safeXp.toString()); } catch { /* UI can still use returned value. */ }
  return Math.min(Number.MAX_SAFE_INTEGER, safeXp + localXp);
}

/** Award device-only points; these are never sent to the server leaderboard. */
export function awardXp(
  amount: number,
  reason: string = 'Completed Activity'
): { newTotal: number; levelInfo: ReturnType<typeof calculateLevelFromXp> } {
  const scope = accountScope();
  const safeAmount = safePoints(amount);
  const newActivity = Math.min(Number.MAX_SAFE_INTEGER, readPoints(scope, 'activity') + safeAmount);
  const newTotal = Math.min(Number.MAX_SAFE_INTEGER, readPoints(scope, 'server') + newActivity);

  try {
    localStorage.setItem(keyFor(scope, 'activity'), newActivity.toString());
    const rawLogs = localStorage.getItem(keyFor(scope, 'log'));
    let logs: any[] = [];
    try { const parsed = rawLogs ? JSON.parse(rawLogs) : []; if (Array.isArray(parsed)) logs = parsed; } catch { /* Start a fresh log. */ }
    logs.unshift({
      id: `xp-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: safeAmount,
      reason,
      timestamp: new Date().toISOString(),
      balanceAfter: newTotal,
    });
    localStorage.setItem(keyFor(scope, 'log'), JSON.stringify(logs.slice(0, 50)));
  } catch { /* Device storage may be unavailable. */ }

  const levelInfo = calculateLevelFromXp(newTotal);
  try {
    window.dispatchEvent(new CustomEvent<XpEventDetail>('learnco_xp_awarded', {
      detail: { amount: safeAmount, reason, totalXp: newTotal, level: levelInfo.level },
    }));
  } catch { /* No browser event target. */ }
  return { newTotal, levelInfo };
}

/** Update the server component without clearing local activity. */
export function setGlobalXp(newTotal: number): void {
  const combined = syncLocalXpOnly(newTotal);
  const levelInfo = calculateLevelFromXp(combined);
  try {
    window.dispatchEvent(new CustomEvent<XpEventDetail>('learnco_xp_awarded', {
      detail: { amount: 0, reason: 'Sync', totalXp: combined, level: levelInfo.level },
    }));
  } catch { /* No browser event target. */ }
}
