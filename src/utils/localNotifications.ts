import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NotificationItem } from '../types';
import { SEED_NOTIFICATIONS } from '../data/seedData';
import { readStoredArray } from './storageSafety';

export function notificationStorageKey(accountId: string): string {
  return `learnco_notifications_v2:account:${encodeURIComponent(accountId)}`;
}

function readNotifications(accountId: string | null): NotificationItem[] {
  if (!accountId) return [];
  try {
    const key = notificationStorageKey(accountId);
    return localStorage.getItem(key) === null ? SEED_NOTIFICATIONS.map(item => ({ ...item })) : readStoredArray<NotificationItem>(key);
  } catch { return []; }
}

type Snapshot = { accountId: string | null; items: NotificationItem[] };

/** Account changes cannot write the previous account's state to the new key. */
export function useLocalNotifications(accountId: string | null): [NotificationItem[], Dispatch<SetStateAction<NotificationItem[]>>] {
  const activeAccount = useRef(accountId);
  activeAccount.current = accountId;
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ accountId, items: readNotifications(accountId) }));
  const items = snapshot.accountId === accountId ? snapshot.items : readNotifications(accountId);
  useEffect(() => {
    setSnapshot(current => current.accountId === accountId ? current : { accountId, items: readNotifications(accountId) });
  }, [accountId]);
  useEffect(() => {
    if (!accountId || snapshot.accountId !== accountId) return;
    try { localStorage.setItem(notificationStorageKey(accountId), JSON.stringify(snapshot.items)); } catch { /* Storage may be unavailable. */ }
  }, [accountId, snapshot]);
  const setItems = useCallback<Dispatch<SetStateAction<NotificationItem[]>>>(update => {
    if (!accountId || activeAccount.current !== accountId) return;
    setSnapshot(current => {
      const previous = current.accountId === accountId ? current.items : readNotifications(accountId);
      return { accountId, items: typeof update === 'function' ? update(previous) : update };
    });
  }, [accountId]);
  return [items, setItems];
}
