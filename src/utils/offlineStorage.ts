import { useState, useEffect } from 'react';
import { calculateLevelFromXp } from '../types/auth';
import { syncLocalXpOnly } from './xpManager';

export interface PendingOfflineAttempt {
  id: string;
  userId?: string; // Older unowned entries are retained but never auto-synced.
  conceptId?: string;
  hintsUsedCount?: number;
  questionId: string;
  subjectId: string;
  topic: string;
  userAnswer: string | number | string[];
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: string;
}

const STORAGE_KEY_PENDING_ATTEMPTS = 'learnco_offline_pending_attempts';

export class OfflineStorageManager {
  /**
   * Save an attempt made while offline
   */
  private static syncing: Promise<number> | null = null;

  static saveOfflineAttempt(attempt: Omit<PendingOfflineAttempt, 'timestamp'>): void {
    const list = this.getPendingAttempts();
    const newEntry: PendingOfflineAttempt = {
      ...attempt,
      timestamp: new Date().toISOString(),
    };
    list.push(newEntry);
    localStorage.setItem(STORAGE_KEY_PENDING_ATTEMPTS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('learnco_offline_queue_updated'));
  }

  /**
   * Retrieve all pending offline attempts
   */
  static getPendingAttempts(): PendingOfflineAttempt[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PENDING_ATTEMPTS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Sync pending offline attempts back to the server
   */
  static syncPendingAttemptsToServer(): Promise<number> {
    if (this.syncing) return this.syncing;
    const task = this.performSync();
    this.syncing = task;
    task.finally(() => { if (this.syncing === task) this.syncing = null; }).catch(() => {});
    return task;
  }

  private static async performSync(): Promise<number> {
    const attempts = this.getPendingAttempts();
    const token = localStorage.getItem('learnco_auth_token');
    let userId: string | undefined;
    try { userId = JSON.parse(localStorage.getItem('learnco_user') || 'null')?.id; } catch { /* No trusted account context. */ }
    if (!token || !userId) return 0;
    const hasEligible = attempts.some((item) => item.userId === userId && Boolean(item.id));
    if (!hasEligible) return 0;
    // Bind the local account label to the server session, including during a
    // sign-in transition or when browser storage is stale.
    try {
      const session = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (!session.ok || (await session.json())?.user?.id !== userId || localStorage.getItem('learnco_auth_token') !== token) return 0;
    } catch { return 0; }

    const syncedIds = new Set<string>();
    for (const item of attempts) {
      // Unowned legacy items cannot be safely attributed to an account.
      if (item.userId !== userId || !item.id) continue;
      if (localStorage.getItem('learnco_auth_token') !== token) break;
      try {
        const res = await fetch('/api/practice/submit-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            attemptId: item.id, questionId: item.questionId, subjectId: item.subjectId,
            topicId: item.topic, conceptId: item.conceptId, selectedAnswer: item.userAnswer,
            isCorrect: item.isCorrect, timeSpentSeconds: item.timeSpentSeconds,
            hintsUsedCount: item.hintsUsedCount,
          }),
        });
        if (res.ok) {
          const result = await res.json().catch(() => null);
          // An HTML shell, proxy response or malformed 200 is not an
          // acknowledgement. Keep the stable ID for an idempotent retry.
          if (result?.success !== true || result.attempt?.id !== item.id ||
              typeof result.isCorrect !== 'boolean' ||
              (result.verification !== 'bank' && result.verification !== 'unverified') ||
              typeof result.newTotalXp !== 'number' || !Number.isFinite(result.newTotalXp)) continue;
          syncedIds.add(item.id);
          // A successful retry may award server XP. Update the display only if
          // the same account and session are still active after the response.
          let currentId: string | undefined;
          try { currentId = JSON.parse(localStorage.getItem('learnco_user') || 'null')?.id; } catch { /* No account context. */ }
          if (localStorage.getItem('learnco_auth_token') === token && currentId === userId) {
            const totalXp = syncLocalXpOnly(result.newTotalXp, userId);
            window.dispatchEvent(new CustomEvent('learnco_xp_awarded', {
              detail: { amount: 0, reason: 'Offline sync', totalXp, level: calculateLevelFromXp(totalXp).level },
            }));
          }
        }
      } catch { /* Keep the item for a later retry. */ }
    }

    // Re-read to preserve entries queued while the requests were in flight.
    const remaining = this.getPendingAttempts().filter(item => !(item.userId === userId && syncedIds.has(item.id)));
    localStorage.setItem(STORAGE_KEY_PENDING_ATTEMPTS, JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent('learnco_offline_queue_updated'));
    window.dispatchEvent(
      new CustomEvent('learnco_offline_synced', {
        detail: { syncedCount: syncedIds.size, timestamp: new Date().toISOString() },
      })
    );
    return syncedIds.size;
  }

  /**
   * Clear all pending attempts
   */
  static clearPendingAttempts(): void {
    localStorage.removeItem(STORAGE_KEY_PENDING_ATTEMPTS);
    window.dispatchEvent(new CustomEvent('learnco_offline_queue_updated'));
  }
}

/**
 * React hook to observe online/offline status
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  pendingOfflineCount: number;
  lastSyncedAt: string | null;
  triggerSync: () => Promise<number>;
} {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(() => {
    return OfflineStorageManager.getPendingAttempts().length;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const refreshCount = () => {
      setPendingCount(OfflineStorageManager.getPendingAttempts().length);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const count = await OfflineStorageManager.syncPendingAttemptsToServer();
        if (count > 0) setLastSyncedAt(new Date().toISOString());
      } catch { /* Keep pending data for retry. */ }
      refreshCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshCount();
    };

    const handleSynced = (e: Event) => {
      const detail = (e as CustomEvent<{ syncedCount?: number; timestamp?: string }>).detail;
      if (detail?.syncedCount && detail.syncedCount > 0 && detail.timestamp) {
        setLastSyncedAt(detail.timestamp);
      }
      refreshCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('learnco_offline_queue_updated', refreshCount);
    window.addEventListener('learnco_offline_synced', handleSynced);

    if ((typeof navigator === 'undefined' || navigator.onLine) && OfflineStorageManager.getPendingAttempts().length > 0) {
      OfflineStorageManager.syncPendingAttemptsToServer()
        .then((count) => {
          if (count > 0) setLastSyncedAt(new Date().toISOString());
          refreshCount();
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('learnco_offline_queue_updated', refreshCount);
      window.removeEventListener('learnco_offline_synced', handleSynced);
    };
  }, []);

  const triggerSync = async () => {
    const synced = await OfflineStorageManager.syncPendingAttemptsToServer();
    if (synced > 0) setLastSyncedAt(new Date().toISOString());
    setPendingCount(OfflineStorageManager.getPendingAttempts().length);
    return synced;
  };

  return { isOnline, pendingOfflineCount: pendingCount, lastSyncedAt, triggerSync };
}
