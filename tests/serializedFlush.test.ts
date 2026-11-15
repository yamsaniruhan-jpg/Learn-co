import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ save: vi.fn(), flush: vi.fn() }));
vi.mock('../server/db', () => ({ Database: { saveToDisk: mocks.save }, flushDb: mocks.flush }));
import { flushCurrentState } from '../server/services/flushCurrentState';

describe('serialized explicit persistence', () => {
  it('waits for each write and continues after a failed flush', async () => {
    let release!: () => void;
    mocks.flush.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
    mocks.flush.mockRejectedValueOnce(new Error('disk failure'));
    mocks.flush.mockResolvedValueOnce(undefined);
    const first = flushCurrentState();
    const second = flushCurrentState();
    const third = flushCurrentState();
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    expect(mocks.flush).toHaveBeenCalledTimes(1);
    release();
    await first;
    await expect(second).rejects.toThrow('disk failure');
    await expect(third).resolves.toBeUndefined();
    expect(mocks.save).toHaveBeenCalledTimes(3);
    expect(mocks.flush).toHaveBeenCalledTimes(3);
  });
});
