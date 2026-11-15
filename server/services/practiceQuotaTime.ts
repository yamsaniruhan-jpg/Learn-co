import { getDateInTimezone } from '../db';

/** The first instant after now at which the user's calendar date changes.
 * Using calendar dates rather than adding 24 hours handles DST transitions.
 * Invalid timezones follow getDateInTimezone's UTC fallback.
 */
export function nextPracticeReset(timezone: string, now = new Date()): string {
  const start = now.getTime();
  const currentDate = getDateInTimezone(timezone, now);
  let low = start;
  let high = start + 60 * 60 * 1000;
  // A local day may exceed 24 hours when clocks move back.
  while (getDateInTimezone(timezone, new Date(high)) === currentDate && high < start + 72 * 60 * 60 * 1000) {
    high += 60 * 60 * 1000;
  }
  while (high - low > 1) {
    const mid = low + Math.floor((high - low) / 2);
    if (getDateInTimezone(timezone, new Date(mid)) === currentDate) low = mid;
    else high = mid;
  }
  return new Date(high).toISOString();
}
