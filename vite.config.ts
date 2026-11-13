import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
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
