// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDefaultStreakData,
  getStreakCalendarMonth,
  formatDateToDateKey,
} from '../src/utils/streakManager';
import { StreakHeatmapCard } from '../src/components/dashboard/StreakHeatmapCard';
import { DashboardView } from '../src/components/dashboard/DashboardView';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'scholar-1',
      email: 'scholar@example.test',
      fullName: 'Ada Lovelace',
      role: 'student',
      xp: 240,
      level: 2,
      currentStreak: 4,
      longestStreak: 9,
      dailyQuestionsSolvedToday: 3,
      dailyAllowanceLimit: 25,
      targetExam: 'Calculus & Olympiad Prep',
    },
    gamification: { xp: 240, currentStreak: 4, longestStreak: 9, dailyQuestionsSolvedToday: 3 },
  }),
}));

vi.mock('../src/components/leaderboard/Leaderboard', () => ({
  Leaderboard: () => <div data-testid="mock-leaderboard">Leaderboard</div>,
}));

vi.mock('../src/services/plannerClient', () => ({
  PlannerClient: {
    getOverview: vi.fn().mockResolvedValue({ tasks: [] }),
  },
}));

vi.mock('../src/hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({
    isInstalled: false,
    isInstallable: false,
    install: vi.fn(),
  }),
}));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('Streak calendar & compact Dashboard UI', () => {
  it('builds calendar month telemetry accurately', () => {
    const streak = getDefaultStreakData(4, 9);
    const sampleDate = new Date(2026, 10, 15, 12, 0, 0);
    const dateKey = formatDateToDateKey(sampleDate);
    streak.streakHistory = [dateKey];
    streak.dailyActivities[dateKey] = {
      questionsSolved: 6,
      xpEarned: 30,
      minutesStudied: 22,
      sessionsCompleted: 1,
    };

    const cal = getStreakCalendarMonth(streak, 2026, 10, sampleDate);
    expect(cal.monthLabel).toBe('November 2026');
    expect(cal.days).toHaveLength(30);
    expect(cal.activeDaysCount).toBe(1);
    const nov15 = cal.days.find((d) => d.dateKey === dateKey)!;
    expect(nov15.questionsSolved).toBe(6);
    expect(nov15.isToday).toBe(true);
  });

  it('renders StreakHeatmapCard with progress bar and calendar/12-week switcher', async () => {
    const streak = getDefaultStreakData(4, 9);
    await act(async () => root.render(<StreakHeatmapCard streakData={streak} />));

    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(container.textContent).toContain('4-Day Streak');
    expect(container.textContent).toContain('Calendar');
    expect(container.textContent).toContain('12 Weeks');

    const heatmapTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      el.textContent?.includes('12 Weeks')
    ) as HTMLButtonElement;
    expect(heatmapTab).toBeTruthy();
    await act(async () => heatmapTab.click());
    expect(heatmapTab.getAttribute('aria-selected')).toBe('true');
  });

  it('allows navigating anywhere from DashboardView Workspace Hub', async () => {
    const onNavigate = vi.fn();
    await act(async () =>
      root.render(
        <DashboardView
          user={{
            id: 'scholar-1',
            email: 'scholar@example.test',
            fullName: 'Ada Lovelace',
            role: 'student',
            xp: 240,
            level: 2,
            currentStreak: 4,
            longestStreak: 9,
            dailyQuestionsSolvedToday: 3,
            dailyAllowanceLimit: 25,
            targetExam: 'STEM Olympiad',
          } as any}
          masteries={[]}
          attempts={[]}
          onNavigate={onNavigate}
        />
      )
    );

    expect(container.textContent).toContain('Workspace Hub');
    expect(container.textContent).toContain('Daily Goal');
    expect(container.textContent).toContain('3/10 Qs');

    const allTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      el.textContent?.includes('All (')
    ) as HTMLButtonElement;
    expect(allTab).toBeTruthy();
    await act(async () => allTab.click());

    const voiceExamBtn = Array.from(container.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Voice') && el.textContent?.includes('Oral')
    ) as HTMLButtonElement;
    expect(voiceExamBtn).toBeTruthy();
    await act(async () => voiceExamBtn.click());
    expect(onNavigate).toHaveBeenCalledWith('voice-exam');
  });
});
