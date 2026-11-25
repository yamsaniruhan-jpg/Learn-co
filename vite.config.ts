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
      {
        name: 'disable-hmr-websocket-when-disabled',
        enforce: 'post' as const,
        transform(code: string, id: string) {
          if (
            id.endsWith('vite/dist/client/client.mjs') ||
            id.endsWith('vite\\dist\\client\\client.mjs')
          ) {
            const patched = code.replace(
              /const transport = normalizeModuleRunnerTransport\([\s\S]*?\);\s*(?=let willUnload = false)/,
              'const transport = normalizeModuleRunnerTransport({ connect() {}, disconnect() {}, send() {} });\n'
            );
            return {
              code: patched,
              map: null,
            };
          }
          return null;
        },
      },
      react(),
      ...tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        manifestFilename: 'manifest.json',
        includeAssets: [
          'favicon.ico',
          'favicon.jpg',
          'logo-mark.png',
          'logo.jpg',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/icon-maskable-512.png',
        ],
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
          // Precache only the core app shell and PWA icons so mobile users don't
          // download 7+ MB of heavy 3D/chart/curriculum chunks on first visit.
          globPatterns: [
            'index.html',
            'manifest.json',
            'icons/icon-*.png',
            'logo-mark.png',
            'assets/index-*.{js,css}',
            'assets/vendor-icons-*.js',
          ],
          // Exclude heavy lazy chunks, alternate image/font assets, and 404.html from upfront precache.
          globIgnores: [
            '**/404.html',
            '**/vendor-three*',
            '**/vendor-recharts*',
            '**/vendor-katex*',
            '**/vendor-firebase*',
            '**/curriculumData*',
            '**/Calculus3DLab*',
            '**/PlannerProgressView*',
            '**/*.{woff,woff2,ttf}',
          ],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          // Claim the first open page and serve only the app shell for offline
          // navigations. Authenticated API responses stay network-only except public curriculum metadata.
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^\/(?:\?.*)?$/],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/.*\.(?:js|css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'lazy-app-chunks-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/assets\/.*\.(?:woff|woff2|ttf)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'katex-local-fonts-cache',
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/learning\/(?:curriculum|tracks)/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'curriculum-subject-api-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
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
          enabled: false,
          type: 'classic',
          suppressWarnings: true,
        },
      }),
    ],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        'recharts',
        'katex',
        'motion/react',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',
      ],
    },
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
