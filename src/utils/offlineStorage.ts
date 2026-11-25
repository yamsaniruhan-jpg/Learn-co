import { useState, useEffect } from 'react';
import { calculateLevelFromXp } from '../types/auth';
import { QuestionBankItem } from '../types/curriculum';
import {
  BUNDLED_OLYMPIAD_PACK,
  OLYMPIAD_CHEAT_SHEETS,
  OlympiadStudyCheatSheet,
} from '../data/offlineOlympiadPack';
import { syncLocalXpOnly } from './xpManager';
import { AuthClient } from '../services/authClient';
import { buildApiHeaders } from './csrf';

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

export type OlympiadPackTrackCounts = Record<'IPhO' | 'IChO' | 'IBHO' | 'IJSO' | 'ICT', number>;

export interface OfflineOlympiadPack {
  version: number;
  downloadedAt: string;
  approxSizeKb: number;
  questions: QuestionBankItem[];
  cheatSheets: OlympiadStudyCheatSheet[];
  trackCounts: OlympiadPackTrackCounts;
}

export interface MobileHomeScreenPackageStatus {
  preparedAt: string;
  filesCachedCount: number;
  questionsCount: number;
  approxSizeKb: number;
}

const STORAGE_KEY_PENDING_ATTEMPTS = 'learnco_offline_pending_attempts';
const STORAGE_KEY_OLYMPIAD_PACK = 'learnco_offline_olympiad_pack_v1';
const STORAGE_KEY_OLYMPIAD_LAUNCH = 'learnco_offline_pack_launch_v1';
const STORAGE_KEY_LAST_SYNCED_AT = 'learnco_last_synced_at_v1';
const STORAGE_KEY_HOME_SCREEN_PACKAGE = 'learnco_home_screen_package_v1';

function computeOlympiadTrackCounts(questions: QuestionBankItem[]): OlympiadPackTrackCounts {
  const counts: OlympiadPackTrackCounts = { IPhO: 0, IChO: 0, IBHO: 0, IJSO: 0, ICT: 0 };
  for (const q of questions) {
    const tagsUpper = (q.tags || []).map((t) => t.toUpperCase());
    const topicUpper = (q.topicId || '').toUpperCase();
    const tracks = q.examTracks || [];
    if (tagsUpper.some((t) => t.includes('IPHO')) || topicUpper.includes('IPHO') || (q.subjectId === 'physics' && tracks.includes('iapt_exams'))) {
      counts.IPhO += 1;
    } else if (tagsUpper.some((t) => t.includes('ICHO')) || topicUpper.includes('ICHO') || (q.subjectId === 'chemistry' && tracks.includes('iapt_exams'))) {
      counts.IChO += 1;
    } else if (tagsUpper.some((t) => t.includes('IBHO') || t.includes('IBO')) || topicUpper.includes('IBHO') || (q.subjectId === 'biology' && tracks.includes('iapt_exams'))) {
      counts.IBHO += 1;
    } else if (tagsUpper.some((t) => t.includes('IJSO') || t.includes('NSEJS')) || topicUpper.includes('IJSO') || tracks.includes('nsejs')) {
      counts.IJSO += 1;
    } else if (tagsUpper.some((t) => t.includes('ICT')) || topicUpper.includes('ICT') || tracks.includes('ict_hackathon') || q.subjectId === 'cs') {
      counts.ICT += 1;
    }
  }
  return counts;
}

export class OfflineStorageManager {
  /**
   * Save an attempt made while offline
   */
  private static syncing: Promise<number> | null = null;
  private static preparingHomeScreenPackage: Promise<MobileHomeScreenPackageStatus> | null = null;

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
   * Download & cache verified Olympiad questions + formula cheat sheets for offline flights/study
   */
  static async downloadOlympiadPack(): Promise<OfflineOlympiadPack> {
    const byId = new Map<string, QuestionBankItem>();
    for (const q of BUNDLED_OLYMPIAD_PACK) {
      byId.set(q.id, q);
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const res = await fetch('/api/learning/questions?limit=60');
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (Array.isArray(data?.questions)) {
            for (const q of data.questions as QuestionBankItem[]) {
              if (q?.id && !byId.has(q.id) && byId.size < 65) {
                byId.set(q.id, q);
              }
            }
          }
        }
      } catch {
        // Offline or server unreachable; keep curated BUNDLED_OLYMPIAD_PACK
      }
    }

    const questions = Array.from(byId.values());
    const packDraft: OfflineOlympiadPack = {
      version: 1,
      downloadedAt: new Date().toISOString(),
      approxSizeKb: 0,
      questions,
      cheatSheets: OLYMPIAD_CHEAT_SHEETS,
      trackCounts: computeOlympiadTrackCounts(questions),
    };

    const rawBytes = new TextEncoder().encode(JSON.stringify(packDraft)).length;
    const pack: OfflineOlympiadPack = {
      ...packDraft,
      approxSizeKb: Math.max(1, Math.round(rawBytes / 1024)),
    };

    localStorage.setItem(STORAGE_KEY_OLYMPIAD_PACK, JSON.stringify(pack));

    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('learnco-olympiad-pack-v1');
        await Promise.allSettled([cache.add('/'), cache.add('/manifest.json')]);
      } catch {
        // Ignore CacheStorage restrictions in sandboxed environments
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnco_olympiad_pack_updated', { detail: pack }));
    }
    return pack;
  }

  /**
   * Cache core app shell files, Home Screen icons, active JS/CSS chunks, and
   * offline study questions into persistent CacheStorage + localStorage when
   * the user adds LearnCo to their mobile Home Screen.
   */
  static prepareMobileHomeScreenPackage(): Promise<MobileHomeScreenPackageStatus> {
    if (this.preparingHomeScreenPackage) return this.preparingHomeScreenPackage;
    const task = this.runPrepareMobileHomeScreenPackage();
    this.preparingHomeScreenPackage = task;
    task
      .finally(() => {
        if (this.preparingHomeScreenPackage === task) {
          this.preparingHomeScreenPackage = null;
        }
      })
      .catch(() => {});
    return task;
  }

  private static async runPrepareMobileHomeScreenPackage(): Promise<MobileHomeScreenPackageStatus> {
    const urls = new Set<string>([
      '/',
      '/index.html',
      '/manifest.json',
      '/apple-touch-icon.png',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/icon-maskable-512.png',
      '/logo-mark.png',
      '/favicon.ico',
    ]);

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const origin = window.location.origin;
      const collectUrl = (rawUrl: string | null | undefined) => {
        if (!rawUrl) return;
        try {
          const parsed = new URL(rawUrl, origin);
          if (parsed.origin !== origin) return;
          if (parsed.pathname.startsWith('/api/')) return;
          urls.add(parsed.pathname + parsed.search);
        } catch {
          // ignore malformed asset URLs
        }
      };

      document
        .querySelectorAll(
          'script[src], link[rel="stylesheet"][href], link[rel="icon"][href], link[rel="apple-touch-icon"][href]'
        )
        .forEach((el) => {
          collectUrl(el.getAttribute('src') || el.getAttribute('href'));
        });

      if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
        for (const entry of performance.getEntriesByType('resource')) {
          const name = (entry as PerformanceResourceTiming)?.name;
          if (
            name &&
            (/\/assets\//.test(name) ||
              /\/icons\//.test(name) ||
              /apple-touch-icon\.png$/.test(name))
          ) {
            collectUrl(name);
          }
        }
      }
    }

    const urlList = Array.from(urls);
    let filesCachedCount = 0;

    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('learnco-offline-app-v1');
        const results = await Promise.allSettled(
          urlList.map(async (url) => {
            if (typeof fetch !== 'function') {
              await cache.add(url);
              return true;
            }
            const res = await fetch(url, { credentials: 'same-origin' });
            if (res && res.ok) {
              await cache.put(url, res.clone());
              return true;
            }
            return false;
          })
        );
        filesCachedCount = results.filter(
          (r) => r.status === 'fulfilled' && r.value === true
        ).length;
      } catch {
        // Ignore CacheStorage unavailability in restricted contexts
      }
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_OFFLINE_PACKAGE',
          urls: urlList,
        });
      } catch {
        // ignore postMessage errors
      }
    }

    const pack = await this.downloadOlympiadPack();
    const status: MobileHomeScreenPackageStatus = {
      preparedAt: new Date().toISOString(),
      filesCachedCount,
      questionsCount: pack.questions.length,
      approxSizeKb: pack.approxSizeKb,
    };

    try {
      localStorage.setItem(STORAGE_KEY_HOME_SCREEN_PACKAGE, JSON.stringify(status));
    } catch {
      // ignore storage quota limits
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('learnco_home_screen_package_ready', { detail: status })
      );
    }

    return status;
  }

  static getMobileHomeScreenPackageStatus(): MobileHomeScreenPackageStatus | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOME_SCREEN_PACKAGE);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as MobileHomeScreenPackageStatus;
      if (!parsed || typeof parsed.preparedAt !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  static getOlympiadPack(): OfflineOlympiadPack | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OLYMPIAD_PACK);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as OfflineOlympiadPack;
      if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  static clearOlympiadPack(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_OLYMPIAD_PACK);
      sessionStorage.removeItem(STORAGE_KEY_OLYMPIAD_LAUNCH);
    } catch {
      // ignore
    }
    if (typeof caches !== 'undefined') {
      caches.delete('learnco-olympiad-pack-v1').catch(() => {});
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnco_olympiad_pack_updated', { detail: null }));
    }
  }

  static queueOfflinePackLaunch(): OfflineOlympiadPack | null {
    const pack = this.getOlympiadPack();
    if (!pack) return null;
    try {
      sessionStorage.setItem(STORAGE_KEY_OLYMPIAD_LAUNCH, '1');
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnco-launch-offline-olympiad-pack', { detail: pack }));
    }
    return pack;
  }

  static consumeOfflinePackLaunch(): OfflineOlympiadPack | null {
    try {
      const pending = sessionStorage.getItem(STORAGE_KEY_OLYMPIAD_LAUNCH);
      if (!pending) return null;
      sessionStorage.removeItem(STORAGE_KEY_OLYMPIAD_LAUNCH);
      return this.getOlympiadPack();
    } catch {
      return null;
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
    const initialSession = AuthClient.getSessionId();
    const userId = AuthClient.getCurrentUser()?.id;
    if (!initialSession || !userId) return 0;
    const hasEligible = attempts.some((item) => item.userId === userId && Boolean(item.id));
    if (!hasEligible) return 0;
    // Bind the local account label to the server session, including during a
    // sign-in transition or when browser storage is stale.
    try {
      const session = await fetch('/api/auth/me', { credentials: 'include' });
      if (
        !session.ok ||
        (await session.json())?.user?.id !== userId ||
        AuthClient.getSessionId() !== initialSession ||
        AuthClient.getCurrentUser()?.id !== userId
      ) {
        return 0;
      }
    } catch { return 0; }

    const syncedIds = new Set<string>();
    for (const item of attempts) {
      // Unowned legacy items cannot be safely attributed to an account.
      if (item.userId !== userId || !item.id) continue;
      if (AuthClient.getSessionId() !== initialSession || AuthClient.getCurrentUser()?.id !== userId) break;
      try {
        const res = await fetch('/api/practice/submit-attempt', {
          method: 'POST',
          credentials: 'include',
          headers: buildApiHeaders(),
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
          const currentId = AuthClient.getCurrentUser()?.id;
          if (AuthClient.getSessionId() === initialSession && currentId === userId) {
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
    const syncTimestamp = new Date().toISOString();
    if (syncedIds.size > 0) {
      this.markCloudSynced(syncTimestamp);
    }
    window.dispatchEvent(new CustomEvent('learnco_offline_queue_updated'));
    window.dispatchEvent(
      new CustomEvent('learnco_offline_synced', {
        detail: { syncedCount: syncedIds.size, timestamp: syncTimestamp },
      })
    );
    return syncedIds.size;
  }

  static getLastSyncedAt(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST_SYNCED_AT);
    } catch {
      return null;
    }
  }

  static markCloudSynced(timestamp: string = new Date().toISOString()): string {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNCED_AT, timestamp);
    } catch {
      // ignore storage unavailability
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('learnco_offline_synced', {
          detail: { syncedCount: 0, cloudSynced: true, timestamp },
        })
      );
    }
    return timestamp;
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
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    OfflineStorageManager.getLastSyncedAt()
  );

  useEffect(() => {
    const refreshCount = () => {
      setPendingCount(OfflineStorageManager.getPendingAttempts().length);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const count = await OfflineStorageManager.syncPendingAttemptsToServer();
        if (count > 0) setLastSyncedAt(OfflineStorageManager.markCloudSynced());
      } catch { /* Keep pending data for retry. */ }
      refreshCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshCount();
    };

    const handleSynced = (e: Event) => {
      const detail = (e as CustomEvent<{ syncedCount?: number; cloudSynced?: boolean; timestamp?: string }>).detail;
      if (((detail?.syncedCount && detail.syncedCount > 0) || detail?.cloudSynced) && detail.timestamp) {
        setLastSyncedAt(detail.timestamp);
      }
      refreshCount();
    };

    const handleVisibilityChange = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        (typeof navigator === 'undefined' || navigator.onLine)
      ) {
        OfflineStorageManager.syncPendingAttemptsToServer()
          .then((count) => {
            if (count > 0) setLastSyncedAt(new Date().toISOString());
            refreshCount();
          })
          .catch(() => {});
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('learnco_offline_queue_updated', refreshCount);
    window.addEventListener('learnco_offline_synced', handleSynced);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

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
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
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
