import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import express from 'express';
import request from 'supertest';
import { createServer } from 'vite';

describe('development file protection', () => {
  it('denies the local store, a custom store and their temporary snapshots', async () => {
    const dir = mkdtempSync(join(process.cwd(), '.audit-vite-'));
    const custom = join(dir, 'account-[test].json');
    writeFileSync(custom, '{"test":true}');
    writeFileSync(`${custom}.tmp`, '{"test":true}');
    const previous = process.env.LEARNCO_DB_FILE;
    process.env.LEARNCO_DB_FILE = custom;
    let vite: Awaited<ReturnType<typeof createServer>> | undefined;
    try {
      vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'spa' });
      const app = express(); app.use(vite.middlewares);
      const customUrl = '/' + relative(process.cwd(), custom).replace(/\\/g, '/');
      for (const url of ['/.learnco_db.json', '/%2elearnco_db.json', '/@fs' + join(process.cwd(), '.learnco_db.json'), customUrl, customUrl + '.tmp']) {
        const response = await request(app).get(url);
        expect(response.status, url).toBe(403);
      }
      expect((await request(app).get('/src/main.tsx')).status).toBe(200);
    } finally {
      await vite?.close();
      if (previous === undefined) delete process.env.LEARNCO_DB_FILE;
      else process.env.LEARNCO_DB_FILE = previous;
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);

  it('refuses to build or serve a configured store in public', async () => {
    const previous = process.env.LEARNCO_DB_FILE;
    process.env.LEARNCO_DB_FILE = join(process.cwd(), 'public', 'private-store.json');
    try {
      await expect(createServer({ server: { middlewareMode: true, hmr: false, ws: false } }))
        .rejects.toThrow('LEARNCO_DB_FILE must not be inside the public directory.');
    } finally {
      if (previous === undefined) delete process.env.LEARNCO_DB_FILE;
      else process.env.LEARNCO_DB_FILE = previous;
    }
  }, 30_000);
});
