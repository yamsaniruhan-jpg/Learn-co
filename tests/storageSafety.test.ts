import { describe, expect, it, vi, afterEach } from 'vitest';
import { readStoredArray } from '../src/utils/storageSafety';

afterEach(() => vi.unstubAllGlobals());

describe('browser storage recovery', () => {
  it.each(['null', '{}', 'false', 'not json', '"text"'])('handles invalid saved data: %s', (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });
    expect(readStoredArray('learnco_attempts')).toEqual([]);
  });
  it('filters null and primitive records from saved arrays', () => {
    vi.stubGlobal('localStorage', { getItem: () => '[null,2,{"id":"ok"}]' });
    expect(readStoredArray('key')).toEqual([{ id: 'ok' }]);
  });
  it('handles disabled browser storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); } });
    expect(readStoredArray('key')).toEqual([]);
  });
});
