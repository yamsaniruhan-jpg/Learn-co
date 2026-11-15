import { Database, flushDb } from '../db';

// Serialize explicit API flushes in this process. The legacy JSON store itself
// is still not a multi-process database or a transactional persistence layer.
let pending: Promise<void> = Promise.resolve();

export function flushCurrentState(): Promise<void> {
  const job = pending.then(async () => {
    Database.saveToDisk();
    await flushDb();
  });
  // Keep the queue usable after a failed write; callers still receive failure.
  pending = job.catch(() => {});
  return job;
}
