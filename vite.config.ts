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
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // The entry chunk is now ~0.40 MB (gzip ~0.12 MB) after route-level code
      // splitting, so this threshold is meaningful again: a 500 kB warning would
      // surface any future import that drags a heavy SDK back into first load.
      // Individual lazy chunks (SimulationsHubView/three, firebaseClient) are
      // legitimately larger and are fetched only when their feature is opened.
      chunkSizeWarningLimit: 800,
    },
  };
});
