// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/context/AuthContext', () => ({useAuth: () => ({gamification:{xp:500, currentStreak:3, longestStreak:3}})}));
vi.mock('../src/components/leaderboard/Leaderboard', () => ({Leaderboard: () => <div>Leaderboard</div>}));
vi.mock('../src/components/common/FormattedMathText', () => ({FormattedMathText: ({text}: {text:string}) => <span>{text}</span>}));
vi.mock('canvas-confetti', () => ({default: vi.fn()}));
import { GamificationView } from '../src/components/gamification/GamificationView';
import { FlashCheckModal } from '../src/components/practice/FlashCheckModal';
let element: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); element=document.createElement('div'); document.body.appendChild(element); root=createRoot(element);
});
afterEach(async () => { await act(async () => root.unmount()); element.remove(); vi.useRealTimers(); });
describe('progress disclosures', () => {
  it('does not award unsupported badges from XP or unscoped historical data', async () => {
    localStorage.setItem('learnco_creator_resources', JSON.stringify([{}]));
    localStorage.setItem('learnco_attempts', JSON.stringify(Array(5).fill({subjectId:'math',isCorrect:true})));
    await act(async () => root.render(<GamificationView />));
    expect(element.textContent).toContain('1 of 6 Unlocked');
    expect(element.textContent).toContain('Other badge criteria are not tracked yet');
    expect(element.textContent).toContain('local activity points plus server practice XP');
  });
  it('identifies fixed flash-check questions and does not claim retention intervals were updated', async () => {
    vi.useFakeTimers(); const complete=vi.fn();
    await act(async () => root.render(<FlashCheckModal isOpen onClose={vi.fn()} onComplete={complete} />));
    expect(element.textContent).toContain('Fixed sample questions, not scheduled reviews');
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(complete).toHaveBeenCalledOnce();
    expect(element.textContent).toContain('device-local activity points');
    expect(element.textContent).not.toContain('Spaced Repetition Retained');
  });
});
