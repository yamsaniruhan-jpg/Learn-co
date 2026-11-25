// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ updateGamificationState: mocks.update }) }));
vi.mock('../src/services/authClient', () => ({ AuthClient: {
  getSessionId: () => {
    const u = JSON.parse(localStorage.getItem('learnco_user') || 'null');
    return u?.id ? `1:${u.id}` : null;
  },
  hasSession: () => Boolean(JSON.parse(localStorage.getItem('learnco_user') || 'null')?.id),
  getCurrentUser: () => JSON.parse(localStorage.getItem('learnco_user') || 'null'),
} }));
vi.mock('../src/utils/sound', () => ({ sounds: { playSuccess: vi.fn(), playFailure: vi.fn() } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../src/components/common/FormattedMathText', () => ({ FormattedMathText: ({text}: {text: string}) => <span>{text}</span> }));
import { PracticeArena } from '../src/components/practice/PracticeArena';

const question: any = { id:'test-question', subjectId:'math', topicId:'algebra', difficulty:'easy', questionType:'single_choice', questionText:'Which answer?', options:['Correct choice','Other choice'], correctAnswer:'Correct choice', explanation:'Explanation' };
let element: HTMLDivElement, root: ReturnType<typeof createRoot>;
function signIn(id: string) { localStorage.setItem('learnco_user', JSON.stringify({id})); }
function button(text: string) { return [...element.querySelectorAll('button')].find(b => b.textContent?.includes(text))!; }
beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); mocks.update.mockReset(); signIn('alice');
  localStorage.setItem('learnco_xp_v2:account:alice:activity', '40');
  element=document.createElement('div'); document.body.appendChild(element); root=createRoot(element);
  await act(async () => { root.render(<PracticeArena questions={[question]} config={{} as any} onFinishSession={vi.fn()} onExit={vi.fn()} />); });
  await act(async () => { button('Correct choice').click(); });
});
afterEach(async () => { await act(async () => root.unmount()); element.remove(); vi.unstubAllGlobals(); });

describe('practice XP display', () => {
  it('records optional confidence locally before submission, without sending it to the server', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => ({ok:true,json:async()=>({success:true,attempt:{id:JSON.parse(init.body as string).attemptId},isCorrect:true,xpEarned:5,newTotalXp:5,verification:'bank'})}));
    vi.stubGlobal('fetch',fetchMock);
    const confidence=element.querySelector('input[value="confident"]') as HTMLInputElement;
    await act(async()=>confidence.click());
    await act(async()=>{button('Submit Answer').click();await new Promise(resolve=>setTimeout(resolve,10));});
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).not.toHaveProperty('confidence');
    const attempts=JSON.parse(localStorage.getItem('learnco_practice_v2:account:alice:attempts') || '[]');
    expect(attempts[0]).toMatchObject({confidence:'confident',verification:'bank',isCorrect:true});
    expect(confidence.disabled || confidence.closest('fieldset')?.disabled).toBe(true);
  });
  it('queues an invalid success response for an idempotent retry without inventing XP', async () => {
    const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({isCorrect:true})});
    vi.stubGlobal('fetch',fetchMock);
    await act(async()=>{button('Submit Answer').click();await new Promise(resolve=>setTimeout(resolve,10));});
    const queue=JSON.parse(localStorage.getItem('learnco_offline_pending_attempts') || '[]');
    expect(queue[0].id).toBe(JSON.parse(fetchMock.mock.calls[0][1].body).attemptId);
    expect(element.textContent).toContain('provisional');
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('keeps offline confidence results provisional', async () => {
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
    await act(async()=>(element.querySelector('input[value="unsure"]') as HTMLInputElement).click());
    await act(async()=>{button('Submit Answer').click();await new Promise(resolve=>setTimeout(resolve,10));});
    const attempts=JSON.parse(localStorage.getItem('learnco_practice_v2:account:alice:attempts') || '[]');
    expect(attempts[0]).toMatchObject({confidence:'unsure',verification:'provisional'});
    const queue=JSON.parse(localStorage.getItem('learnco_offline_pending_attempts') || '[]');
    expect(queue[0]).not.toHaveProperty('confidence');
  });
  it('queues reordered multi-select answers as an array with provisional correct feedback', async () => {
    const multi = {...question, id:'multi', questionType:'multiple_choice', options:['A, B','C','Wrong'], correctAnswer:['A, B','C']};
    await act(async () => { root.unmount(); root=createRoot(element); root.render(<PracticeArena questions={[multi]} config={{} as any} onFinishSession={vi.fn()} onExit={vi.fn()} />); });
    const fetch = vi.fn().mockRejectedValue(new Error('offline')); vi.stubGlobal('fetch', fetch);
    await act(async () => { button('C').click(); });
    await act(async () => { button('A, B').click(); });
    await act(async () => { button('Submit Answer').click(); await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(JSON.parse(fetch.mock.calls[0][1].body).selectedAnswer).toEqual(['C','A, B']);
    const queued = JSON.parse(localStorage.getItem('learnco_offline_pending_attempts') || '[]');
    expect(queued[0]).toMatchObject({userAnswer:['C','A, B'], isCorrect:true});
  });
  it('adds the new server balance to device points without losing either', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => ({ok:true,json:async()=>({success:true,attempt:{id:JSON.parse(init.body as string).attemptId},isCorrect:true,xpEarned:5,newTotalXp:10,newLevel:1,dailyQuestionsSolvedToday:2,currentStreak:1,verification:'bank'})})));
    await act(async () => { button('Submit Answer').click(); await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({xp:50,dailyQuestionsSolvedToday:2}));
    expect(localStorage.getItem('learnco_xp_v2:account:alice:server')).toBe('10');
    expect(localStorage.getItem('learnco_xp_v2:account:alice:activity')).toBe('40');
    const attempts = JSON.parse(localStorage.getItem('learnco_practice_v2:account:alice:attempts') || '[]');
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({questionId:'test-question', topicId:'algebra', userAnswer:'Correct choice', xpAwarded:5, hintsRevealed:0});
    expect(localStorage.getItem('learnco_practice_v2:account:bob:attempts')).toBeNull();
    expect(localStorage.getItem('learnco_attempts')).toBeNull();
  });
  it('does not apply a delayed answer to a different signed-in account', async () => {
    let release!: (value: any) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => {release=resolve;})));
    await act(async () => { button('Submit Answer').click(); });
    signIn('bob');
    await act(async () => { release({ok:true,json:async()=>({isCorrect:true,xpEarned:5,newTotalXp:10})}); await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(localStorage.getItem('learnco_xp_v2:account:bob:server')).toBeNull();
    expect(element.textContent).toContain('session changed');
  });
});
