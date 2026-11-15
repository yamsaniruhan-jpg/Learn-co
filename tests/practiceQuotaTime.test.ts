import { describe, expect, it } from 'vitest';
import { nextPracticeReset } from '../server/services/practiceQuotaTime';

describe('practice quota reset time', () => {
  it.each([
    ['UTC', '2026-01-15T10:00:00.000Z', '2026-01-16T00:00:00.000Z'],
    ['Asia/Kolkata', '2026-01-15T10:00:00.000Z', '2026-01-15T18:30:00.000Z'],
    ['America/New_York', '2026-03-08T06:00:00.000Z', '2026-03-09T04:00:00.000Z'],
    ['America/New_York', '2026-11-01T04:30:00.000Z', '2026-11-02T05:00:00.000Z'],
    ['Not/AZone', '2026-01-15T10:00:00.000Z', '2026-01-16T00:00:00.000Z'],
  ])('finds next date boundary for %s at %s', (zone, now, expected) => {
    expect(nextPracticeReset(zone, new Date(now))).toBe(expected);
  });
});
