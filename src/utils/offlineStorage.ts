import { useState, useEffect } from 'react';

export interface PendingOfflineAttempt {
  id: string;
  questionId: string;
  subjectId: string;
  topic: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: string;
}

const STORAGE_KEY_PENDING_ATTEMPTS = 'learnco_offline_pending_attempts';
const STORAGE_KEY_CACHED_CURRICULUM = 'learnco_offline_cached_curriculum';

export class OfflineStorageManager {
  /**
   * Save an attempt made while offline
   */
  static saveOfflineAttempt(attempt: Omit<PendingOfflineAttempt, 'id' | 'timestamp'>): void {
    const list = this.getPendingAttempts();
    const newEntry: PendingOfflineAttempt = {
      ...attempt,
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sync pending offline attempts back to the server
   */
  static async syncPendingAttemptsToServer(): Promise<number> {
    const attempts = this.getPendingAttempts();
    if (attempts.length === 0) return 0;

    const token = localStorage.getItem('learnco_auth_token');
    if (!token) return 0;

    let syncedCount = 0;
    const remainingAttempts: PendingOfflineAttempt[] = [];

    for (const item of attempts) {
      try {
        const res = await fetch('/api/copilot/practice/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: item.questionId,
            subjectId: item.subjectId,
            topic: item.topic,
            userAnswer: item.userAnswer,
            isCorrect: item.isCorrect,
            timeSpentSeconds: item.timeSpentSeconds,
          }),
        });

        if (res.ok) {
          syncedCount++;
        } else {
          remainingAttempts.push(item);
        }
      } catch {
        remainingAttempts.push(item);
      }
    }

    localStorage.setItem(STORAGE_KEY_PENDING_ATTEMPTS, JSON.stringify(remainingAttempts));
    window.dispatchEvent(new CustomEvent('learnco_offline_queue_updated'));
    return syncedCount;
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
  triggerSync: () => Promise<number>;
} {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(() => {
    return OfflineStorageManager.getPendingAttempts().length;
  });

  useEffect(() => {
    const refreshCount = () => {
      setPendingCount(OfflineStorageManager.getPendingAttempts().length);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await OfflineStorageManager.syncPendingAttemptsToServer();
      refreshCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('learnco_offline_queue_updated', refreshCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('learnco_offline_queue_updated', refreshCount);
    };
  }, []);

  const triggerSync = async () => {
    const synced = await OfflineStorageManager.syncPendingAttemptsToServer();
    setPendingCount(OfflineStorageManager.getPendingAttempts().length);
    return synced;
  };

  return { isOnline, pendingOfflineCount: pendingCount, triggerSync };
}
