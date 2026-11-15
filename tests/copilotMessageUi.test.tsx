// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({submit:vi.fn()}));
vi.mock('../src/services/copilotClient', () => ({CopilotClient:{submitPracticeAnswer:mocks.submit}}));
vi.mock('../src/components/common/FormattedMathText', () => ({FormattedMathText: ({text}:{text:string}) => <span>{text}</span>}));
vi.mock('canvas-confetti', () => ({default:vi.fn()}));
import { CopilotMessageItem } from '../src/components/copilot/CopilotMessageItem';
let el: HTMLDivElement, root: ReturnType<typeof createRoot>;
const message:any = {id:'m1',conversationId:'c1',userId:'alice',role:'assistant',content:'Here is a response.',timestamp:'2026-01-01T00:00:00Z',
  citations:[{sourceId:'s1',title:'Notes',sourceType:'creator_studio',snippet:'text'}],
  artifact:{type:'practice_question',data:{id:'custom',questionText:'What?',options:['Yes','No'],correctAnswer:'Yes',explanation:'Explanation'}}};
const button = (text:string) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes(text))!;
beforeEach(() => {(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true; mocks.submit.mockReset();el=document.createElement('div');document.body.appendChild(el);root=createRoot(el);});
afterEach(async () => {await act(async()=>root.unmount());el.remove();});
describe('Copilot message evidence and recovery', () => {
  it('labels retrieved context as unverified and exposes expanded state', async () => {
    await act(async()=>root.render(<CopilotMessageItem message={message} userFullName="Alice" />));
    expect(el.textContent).toContain('not verified citations');
    const toggle=button('Retrieved reference material'); expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await act(async()=>toggle.click()); expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(el.textContent).toContain('generated questions earn no server XP');
  });
  it('allows retry after a failed practice submission without showing false feedback', async () => {
    mocks.submit.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({isCorrect:true,message:'Unverified self-check'});
    await act(async()=>root.render(<CopilotMessageItem message={message} userFullName="Alice" />));
    await act(async()=>{button('Yes').click();await Promise.resolve();});
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Check practice history');
    expect(button('Yes').disabled).toBe(false);
    await act(async()=>{button('Yes').click();await Promise.resolve();});
    expect(el.textContent).toContain('Unverified self-check');
    expect(button('Yes').disabled).toBe(true);
  });
});
