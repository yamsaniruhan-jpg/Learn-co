import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

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
    plugins: [react(), ...tailwindcss()],
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
