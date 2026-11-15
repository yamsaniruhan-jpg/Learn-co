// npm start serves the built application by default, independent of shell syntax.
// An explicitly supplied NODE_ENV still takes precedence.
process.env.NODE_ENV ||= 'production';
require('../dist/server.cjs').startServer().catch((error) => {
  console.error('[Server] Startup failed:', error);
  process.exitCode = 1;
});
