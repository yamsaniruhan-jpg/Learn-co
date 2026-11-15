// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { practiceStorageKey, readLocalPractice, useLocalPractice } from '../src/utils/localPractice';
import { notificationStorageKey, useLocalNotifications } from '../src/utils/localNotifications';

let element: HTMLDivElement, root: ReturnType<typeof createRoot>;
let seen: Array<{account: string | null, attempts: string[], notes: string[]}>;
let update: React.Dispatch<React.SetStateAction<any[]>>;
function Consumer({ account }: {account: string | null}) {
  const practice = useLocalPractice(account);
  const [notes, setNotes] = useLocalNotifications(account);
  update = setNotes;
  seen.push({account, attempts:practice.attempts.map(a => a.id), notes:notes.map(n => n.id)});
  return <div>{practice.attempts.map(a => a.id).join(',')} | {notes.map(n => n.id).join(',')}</div>;
}
const attempt = (id: string) => ({id, isCorrect:true});
const note = (id: string) => ({id, title:id, message:id, type:'system', timestamp:'now', isRead:false});
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); seen = [];
  element = document.createElement('div'); document.body.appendChild(element); root = createRoot(element);
});
afterEach(async () => { await act(async () => root.unmount()); element.remove(); });

describe('account-scoped device practice and notifications', () => {
  it('ignores but preserves unattributed legacy data and handles corrupt scoped records', () => {
    localStorage.setItem('learnco_attempts', JSON.stringify([attempt('legacy')]));
    localStorage.setItem('learnco_masteries', JSON.stringify([{conceptId:'legacy'}]));
    localStorage.setItem(practiceStorageKey('alice','attempts'), 'invalid');
    expect(readLocalPractice('alice').attempts).toEqual([]);
    expect(readLocalPractice('alice').masteries).toEqual([]);
    expect(localStorage.getItem('learnco_attempts')).toContain('legacy');
    expect(localStorage.getItem('learnco_masteries')).toContain('legacy');
  });
  it('shows each account only its own data even during a switch and restores it on return', async () => {
    localStorage.setItem('learnco_notifications', JSON.stringify([note('legacy')]));
    localStorage.setItem(practiceStorageKey('alice','attempts'), JSON.stringify([attempt('alice-attempt')]));
    localStorage.setItem(practiceStorageKey('bob','attempts'), JSON.stringify([attempt('bob-attempt')]));
    localStorage.setItem(notificationStorageKey('alice'), JSON.stringify([note('alice-note')]));
    localStorage.setItem(notificationStorageKey('bob'), JSON.stringify([note('bob-note')]));
    await act(async () => root.render(<Consumer account="alice" />));
    const oldUpdate = update;
    seen = [];
    await act(async () => root.render(<Consumer account="bob" />));
    expect(seen.every(x => x.attempts.join() === 'bob-attempt' && x.notes.join() === 'bob-note')).toBe(true);
    await act(async () => oldUpdate([note('stale')]));
    expect(localStorage.getItem(notificationStorageKey('bob'))).not.toContain('stale');
    await act(async () => update(prev => [...prev, note('bob-new')]));
    expect(localStorage.getItem(notificationStorageKey('bob'))).toContain('bob-new');
    expect(localStorage.getItem(notificationStorageKey('alice'))).not.toContain('bob-new');
    seen = [];
    await act(async () => root.render(<Consumer account="alice" />));
    expect(seen.every(x => x.attempts.join() === 'alice-attempt' && x.notes.join() === 'alice-note')).toBe(true);
    await act(async () => root.render(<Consumer account={null} />));
    expect(element.textContent).toBe(' | ');
    expect(localStorage.getItem('learnco_notifications')).toContain('legacy');
  });
  it('refreshes only matching account events and responds to cross-tab updates', async () => {
    await act(async () => root.render(<Consumer account="alice" />));
    localStorage.setItem(practiceStorageKey('alice','attempts'), JSON.stringify([attempt('new')]));
    await act(async () => window.dispatchEvent(new CustomEvent('learnco_attempts_updated', {detail:{accountId:'bob'}})));
    expect(element.textContent).not.toContain('new');
    await act(async () => window.dispatchEvent(new CustomEvent('learnco_attempts_updated', {detail:{accountId:'alice'}})));
    expect(element.textContent).toContain('new');
    localStorage.setItem(practiceStorageKey('alice','attempts'), JSON.stringify([attempt('cross-tab')]));
    await act(async () => window.dispatchEvent(new StorageEvent('storage', {key:practiceStorageKey('alice','attempts')})));
    expect(element.textContent).toContain('cross-tab');
  });
});
