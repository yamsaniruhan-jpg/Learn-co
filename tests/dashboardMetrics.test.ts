import { describe, expect, it } from 'vitest';
import { getDefaultStreakData, getRecentStudyMinutes } from '../src/utils/streakManager';

describe('dashboard study time', () => {
  it('counts only non-negative recorded minutes from the last seven local days', () => {
    const data = getDefaultStreakData();
    data.dailyActivities = {
      '2026-04-10': { questionsSolved: 0, xpEarned: 0, minutesStudied: 25, sessionsCompleted: 1 },
      '2026-04-04': { questionsSolved: 1, xpEarned: 5, minutesStudied: 12, sessionsCompleted: 1 },
      '2026-04-03': { questionsSolved: 1, xpEarned: 5, minutesStudied: 100, sessionsCompleted: 1 },
      '2026-04-11': { questionsSolved: 0, xpEarned: 0, minutesStudied: 100, sessionsCompleted: 0 },
      '2026-04-09': { questionsSolved: 0, xpEarned: 0, minutesStudied: -3, sessionsCompleted: 0 },
    };
    expect(getRecentStudyMinutes(data, new Date(2026, 3, 10, 12))).toBe(37);
  });
  it('does not invent study time for a new learner', () => {
    expect(getRecentStudyMinutes(getDefaultStreakData())).toBe(0);
  });
});
