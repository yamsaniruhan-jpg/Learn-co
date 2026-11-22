import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mountProductionStatic } from '../server';

const dir = mkdtempSync(join(tmpdir(), 'learnco-public-routes-'));
const app = express();
beforeAll(() => {
  writeFileSync(join(dir, 'index.html'), '<h1>App shell</h1>');
  for (const file of ['404.html', 'robots.txt', 'sitemap.xml']) copyFileSync(join(process.cwd(), 'public', file), join(dir, file));
  mountProductionStatic(app, dir);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('public production routes', () => {
  it('serves the app shell at root including password-reset query strings', async () => {
    expect((await request(app).get('/')).text).toContain('App shell');
    expect((await request(app).get('/?reset_token=synthetic').set('Accept', 'text/html')).status).toBe(200);
  });
  it('serves actual crawler files with appropriate types', async () => {
    const robots = await request(app).get('/robots.txt');
    expect(robots.status).toBe(200);
    expect(robots.type).toMatch(/text\/plain/);
    expect(robots.text).toContain('Sitemap: https://learn-co.ai.studio/sitemap.xml');
    const sitemap = await request(app).get('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(sitemap.type).toMatch(/xml/);
    expect(sitemap.text).toContain('<loc>https://learn-co.ai.studio/</loc>');
  });
  it('returns a 404 page instead of the app shell for unknown navigations', async () => {
    const result = await request(app).get('/not-a-real-page').set('Accept', 'text/html');
    expect(result.status).toBe(404);
    expect(result.text).toContain('Page not found');
    expect(result.text).not.toContain('App shell');
  });
  it('returns 404 for missing assets and direct 404 requests', async () => {
    expect((await request(app).get('/assets/missing.js').set('Accept', 'application/javascript')).status).toBe(404);
    expect((await request(app).get('/404.html')).status).toBe(404);
  });
});
