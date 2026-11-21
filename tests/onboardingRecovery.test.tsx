// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ save: vi.fn(), confetti: vi.fn() }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ profile: { displayName: 'Synthetic Scholar' }, saveOnboarding: mocks.save }) }));
vi.mock('canvas-confetti', () => ({ default: mocks.confetti }));
import { OnboardingWizard } from '../src/components/auth/OnboardingWizard';

let el: HTMLDivElement, root: Root;
beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.save.mockReset(); mocks.confetti.mockClear();
  el = document.createElement('div'); document.body.appendChild(el); root = createRoot(el);
  await act(async () => root.render(<OnboardingWizard />));
});
afterEach(async () => { await act(async () => root.unmount()); el.remove(); });

async function clickButton(text: string) {
  const button = [...el.querySelectorAll('button')].find(b => b.textContent?.includes(text));
  expect(button).toBeTruthy();
  await act(async () => { button!.click(); });
}

describe('onboarding recovery', () => {
  it('announces a save failure, retains input and permits retry', async () => {
    mocks.save.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce(undefined);
    for (let i = 0; i < 3; i++) await clickButton('Continue');
    await clickButton('Launch Learn.co Workspace');
    expect(el.querySelector('[role=alert]')?.textContent).toMatch(/could not save/i);
    expect(mocks.confetti).not.toHaveBeenCalled();
    const retry = [...el.querySelectorAll('button')].find(b => b.textContent?.includes('Launch Learn.co Workspace'))!;
    expect(retry.disabled).toBe(false);
    await clickButton('Launch Learn.co Workspace');
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save.mock.calls[1][0].displayName).toBe('Synthetic Scholar');
    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(mocks.confetti).toHaveBeenCalledOnce();
  });
});
