// npm start serves the built application by default, independent of shell syntax.
// An explicitly supplied NODE_ENV still takes precedence.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

process.env.NODE_ENV ||= 'production';

const rootDir = path.resolve(__dirname, '..');
const serverBundlePath = path.join(rootDir, 'dist', 'server.cjs');
const clientIndexPath = path.join(rootDir, 'dist', 'index.html');

if (!fs.existsSync(serverBundlePath) || !fs.existsSync(clientIndexPath)) {
  console.log('[Server] Built artifacts missing; running npm run build before starting...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

require(serverBundlePath).startServer().catch((error) => {
  console.error('[Server] Startup failed:', error);
  process.exitCode = 1;
});

