// @vitest-environment jsdom
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineStorageManager } from '../src/utils/offlineStorage';

describe('Mobile Home Screen assets, packaging & deployment config', () => {
  const originalCaches = (globalThis as any).caches;
  const originalFetch = (globalThis as any).fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    (globalThis as any).caches = originalCaches;
    (globalThis as any).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('ships valid Home Screen PNG icons, Apple touch icon, and PWA manifest', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    for (const rel of [
      'apple-touch-icon.png',
      'icons/icon-192.png',
      'icons/icon-512.png',
      'icons/icon-maskable-512.png',
      'manifest.json',
      'sw.js',
    ]) {
      const fullPath = path.join(publicDir, rel);
      expect(fs.existsSync(fullPath), `${rel} should exist`).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(200);
    }

    const applePng = fs.readFileSync(path.join(publicDir, 'apple-touch-icon.png'));
    expect(applePng.subarray(0, 4).toString('hex')).toBe('89504e47');

    const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.json'), 'utf8'));
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.short_name).toBe('LearnCo');
    expect(manifest.icons.some((i: any) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i: any) => i.sizes === '512x512' && i.purpose === 'maskable')).toBe(true);

    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('href="/apple-touch-icon.png"');
    expect(html).toContain('href="/manifest.json"');
  });

  it('stores all core app files, icons, and offline study pack when Add to mobile runs', async () => {
    const stored = new Map<string, unknown>();
    const cachePut = vi.fn(async (url: string, res: unknown) => {
      stored.set(url, res);
    });
    (globalThis as any).caches = {
      open: vi.fn(async () => ({
        put: cachePut,
        add: vi.fn(async (url: string) => {
          stored.set(url, { ok: true });
        }),
      })),
    };
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/api/learning/questions')) {
        return { ok: true, json: async () => ({ questions: [] }) };
      }
      return {
        ok: true,
        clone: () => ({ url }),
      };
    });

    const status = await OfflineStorageManager.prepareMobileHomeScreenPackage();
    expect(status.filesCachedCount).toBeGreaterThanOrEqual(9);
    expect(status.questionsCount).toBeGreaterThan(0);
    expect(stored.has('/')).toBe(true);
    expect(stored.has('/manifest.json')).toBe(true);
    expect(stored.has('/apple-touch-icon.png')).toBe(true);
    expect(stored.has('/icons/icon-192.png')).toBe(true);
    expect(stored.has('/icons/icon-512.png')).toBe(true);
    expect(OfflineStorageManager.getMobileHomeScreenPackageStatus()?.filesCachedCount).toBe(
      status.filesCachedCount
    );
  });

  it('matches runtime Node 22 and includes all build tools in production dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.engines?.node).toContain('22');
    for (const dep of ['vite', 'vite-plugin-pwa', 'esbuild', 'tailwindcss', 'tsx', 'typescript']) {
      expect(pkg.dependencies?.[dep], `${dep} must be in dependencies for production builds`).toBeTruthy();
    }
    expect(fs.existsSync(path.resolve(process.cwd(), 'package-lock.json'))).toBe(true);
  });
});
