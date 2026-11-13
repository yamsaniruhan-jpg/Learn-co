import { describe, expect, it, vi } from 'vitest';
import { logSqlFailure } from '../src/db/errors';

describe('SQL error logging', () => {
  it('does not log query parameters, messages, or unsafe codes', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      logSqlFailure('Query failed', { message: 'private data', params: ['private data'], cause: { code: 'ECONNREFUSED', message: 'private data' } });
      logSqlFailure('Query failed', { code: 'private data' });
      expect(spy.mock.calls).toEqual([
        ['[CloudSQL] Query failed (ECONNREFUSED)'],
        ['[CloudSQL] Query failed'],
      ]);
    } finally {
      spy.mockRestore();
    }
  });
});
