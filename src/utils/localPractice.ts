import { useEffect, useState } from 'react';
import type { ConceptMastery, QuestionAttempt } from '../types';
import { readStoredArray } from './storageSafety';

// Legacy unscoped records are retained, but cannot be attributed safely to an account.
export function practiceStorageKey(accountId: string, kind: 'attempts' | 'masteries'): string {
  return `learnco_practice_v2:account:${encodeURIComponent(accountId)}:${kind}`;
}

type PracticeSnapshot = { accountId: string | null; attempts: QuestionAttempt[]; masteries: ConceptMastery[] };

export function readLocalPractice(accountId: string | null): PracticeSnapshot {
  if (!accountId) return { accountId: null, attempts: [], masteries: [] };
  return {
    accountId,
    attempts: readStoredArray<QuestionAttempt>(practiceStorageKey(accountId, 'attempts')),
    masteries: readStoredArray<ConceptMastery>(practiceStorageKey(accountId, 'masteries')),
  };
}

/** Never render the previous account's snapshot while effects catch up. */
export function useLocalPractice(accountId: string | null): PracticeSnapshot {
  const [snapshot, setSnapshot] = useState(() => readLocalPractice(accountId));
  useEffect(() => {
    const refresh = () => setSnapshot(readLocalPractice(accountId));
    const onPractice = (event: Event) => {
      if ((event as CustomEvent<{ accountId: string }>).detail?.accountId === accountId) refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (accountId && (event.key === null || event.key === practiceStorageKey(accountId, 'attempts') || event.key === practiceStorageKey(accountId, 'masteries'))) refresh();
    };
    refresh();
    window.addEventListener('learnco_attempts_updated', onPractice);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('learnco_attempts_updated', onPractice);
      window.removeEventListener('storage', onStorage);
    };
  }, [accountId]);
  return snapshot.accountId === accountId ? snapshot : readLocalPractice(accountId);
}
