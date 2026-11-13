import { defineConfig } from 'vitest/config';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    // `.tsx` is included so React components can be rendered in tests.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // The server holds a JSON-backed in-memory store; run files sequentially so
    // they don't race on the same data file.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      // Never write into the developer's live `.learnco_db.json`. Each run gets
      // its own throwaway file outside the repo.
      LEARNCO_DB_FILE: path.join(
        os.tmpdir(),
        `learnco-test-db-${process.pid}-${Date.now()}.json`
      ),
    },
  },
});
