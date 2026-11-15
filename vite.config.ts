import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const dataFileGlob = process.env.LEARNCO_DB_FILE
    ? path.resolve(process.env.LEARNCO_DB_FILE).replace(/\\/g, '/').replace(/([*?{}\[\]()!+@])/g, '\\$1')
    : null;
  // Vite serves and copies public/ without applying server.fs.deny. Refuse a
  // database there instead of exposing it in both dev and production builds.
  if (process.env.LEARNCO_DB_FILE) {
    const relativeToPublic = path.relative(path.resolve('public'), path.resolve(process.env.LEARNCO_DB_FILE));
    if (!relativeToPublic.startsWith('..' + path.sep) && relativeToPublic !== '..' && !path.isAbsolute(relativeToPublic)) {
      throw new Error('LEARNCO_DB_FILE must not be inside the public directory.');
    }
  }
  return {
    // `@tailwindcss/vite` v4 returns an array of plugins, so it must be spread
    // flat instead of nested inside the plugins array.
    plugins: [
      {
        name: 'deny-learnco-db',
        configureServer(server) {
          const customBase = process.env.LEARNCO_DB_FILE
            ? path.basename(path.resolve(process.env.LEARNCO_DB_FILE))
            : null;
          server.middlewares.use((req, res, next) => {
            const rawPath = (req.url || '').split('?')[0];
            let decoded = rawPath;
            try {
              decoded = decodeURIComponent(rawPath);
            } catch {
              // ignore malformed encoding
            }
            if (
              decoded.includes('.learnco_db.json') ||
              (customBase && decoded.includes(customBase))
            ) {
              res.statusCode = 403;
              res.end('Forbidden');
              return;
            }
            next();
          });
        },
      },
      react(),
      ...tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        manifestFilename: 'manifest.json',
        includeAssets: ['favicon.jpg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
        manifest: {
          id: '/',
          name: 'Learn.co - AI Learning Companion',
          short_name: 'LearnCo',
          description: 'An AI-powered learning companion built to support the way we learn.',
          theme_color: '#6C5CE7',
          background_color: '#F7F5FF',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Claim the first open page and serve only the app shell for offline
          // navigations. API responses remain network-only and are never cached.
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/healthz$/, /^\/_ah\/health$/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      // `@` points at the project root (matches the tsconfig `paths` mapping).
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      // Dev/preview traffic is proxied through sandbox hostnames such as
      // `3000-<id>.e2b.app`, so the host allowlist must not be restricted.
      allowedHosts: true as const,
      // The development server serves files from the repository root. Never
      // expose the local account/session store (including its atomic snapshot).
      fs: {
        deny: [
          '.env', '.env.*', '*.{crt,pem}', '**/.git/**',
          '**/.learnco_db.json', '**/.learnco_db.json.tmp',
          ...(dataFileGlob ? [dataFileGlob, `${dataFileGlob}.tmp`] : []),
        ],
      },
      hmr: false,
      ws: false as const,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Firebase + KaTeX + Recharts + Three are unavoidably large; keep the
      // warning threshold meaningful instead of noisy.
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-three': ['three'],
            'vendor-recharts': ['recharts'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'vendor-katex': ['katex'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
