import "dotenv/config";
import fs from "fs";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import authRoutes from "./server/routes/authRoutes";
import userRoutes from "./server/routes/userRoutes";
import practiceRoutes from "./server/routes/practiceRoutes";
import leaderboardRoutes from "./server/routes/leaderboardRoutes";
import aiRoutes from "./server/routes/aiRoutes";
import creatorRoutes from "./server/routes/creatorRoutes";
import learningRoutes from "./server/routes/learningRoutes";
import copilotRoutes from "./server/routes/copilotRoutes";
import { mentorshipRouter } from "./server/routes/mentorshipRoutes";
import plannerRoutes from "./server/routes/plannerRoutes";
import { analyticsRouter } from "./server/routes/analyticsRoutes";
import studyRoomRoutes from "./server/routes/studyRoomRoutes";
import { studyRoomHub } from "./server/services/studyRoomHub";
// Legacy CommonJS routers. Their folders are marked `"type": "commonjs"`, so
// these default imports resolve in dev (ESM + tsx) and in the bundled CJS build.
import subscriptionRoutes from "./routes/subscription";
import gamificationRoutes from "./routes/gamification";
import marketplaceRoutes from "./routes/marketplace";
import { setSessionResolver } from "./middleware/auth";
import { Database, flushDb } from "./server/db";
import cors from "cors";
import cookieParser from "cookie-parser";
import securityHeaders, { cspNonceMiddleware, injectNonceIntoHtml } from "./server/middleware/securityHeaders";
import { createCsrfProtection, ensureCsrfCookie } from "./server/middleware/csrf";
import { requireAuth } from "./server/middleware/authMiddleware";
import aiRateLimiter from "./server/middleware/aiRateLimit";

/** Serve built public files without turning unknown URLs into soft 404s, injecting per-request CSP nonces into HTML. */
export function mountProductionStatic(app: express.Express, distPath: string) {
  const indexHtmlPath = path.join(distPath, 'index.html');
  const notFoundHtmlPath = path.join(distPath, '404.html');

  const sendNoncedHtml = (req: express.Request, res: express.Response, filePath: string, status: number) => {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      ensureCsrfCookie(req, res);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(status).send(injectNonceIntoHtml(raw, String(res.locals.cspNonce || '')));
    } catch {
      res.status(status === 200 ? 404 : status).type('text').send('Not found');
    }
  };

  app.get(['/', '/index.html'], (req, res) => sendNoncedHtml(req, res, indexHtmlPath, 200));
  app.get('/404.html', (req, res) => sendNoncedHtml(req, res, notFoundHtmlPath, 404));
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      const base = path.basename(filePath);
      if (base === 'sw.js' || base === 'manifest.json') {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
      if (base === 'sw.js') {
        res.setHeader('Service-Worker-Allowed', '/');
      }
    },
  }));
  app.use((req, res) => {
    if ((req.method === 'GET' || req.method === 'HEAD') && req.accepts('html')) {
      return sendNoncedHtml(req, res, notFoundHtmlPath, 404);
    }
    res.status(404).type('text').send('Not found');
  });
}

/**
 * Builds the fully-wired Express application without binding a port.
 * Exported so integration tests can exercise the real route stack.
 */
export async function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  // ORDER MATTERS — nonce generation before security headers
  app.use(cspNonceMiddleware);
  app.use(securityHeaders);

  // Same-origin requests need no CORS permission. Cross-origin browser clients
  // must be listed explicitly; do not trust entire shared hosting domains.
  const runtimeOrigins: string[] = [];
  for (const rawUrl of [process.env.APP_URL, process.env.APP_ORIGIN]) {
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          runtimeOrigins.push(parsed.origin);
        }
      } catch {
        // Ignore invalid APP_URL/APP_ORIGIN placeholder
      }
    }
  }
  const allowedOrigins = new Set([
    "https://learn-co.ai.studio",
    ...runtimeOrigins,
    ...(process.env.CORS_ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean),
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
  ]);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.has(origin));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    })
  );

  // Stripe verifies the signature against the original bytes, before JSON parsing.
  app.use("/api/subscription/webhook", express.raw({ type: "application/json", limit: "1mb" }));

  // Creator document uploads and Copilot photo doubts accept base64 payloads up to 10mb; all other routes are capped at 100kb.
  const largeUploadJsonParser = express.json({ limit: "10mb" });
  const defaultJsonParser = express.json({ limit: "100kb" });
  app.post("/api/creator/sources", largeUploadJsonParser);
  app.post("/api/copilot/chat", largeUploadJsonParser);
  app.post("/api/copilot/stream", largeUploadJsonParser);
  app.use((req, res, next) => {
    if (
      req.method === "POST" &&
      (req.path === "/api/creator/sources" ||
        req.path === "/api/copilot/chat" ||
        req.path === "/api/copilot/stream")
    ) {
      return next();
    }
    return defaultJsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  // Cookie parser & CSRF protection for state-changing API requests
  app.use(cookieParser());
  app.use("/api", createCsrfProtection(allowedOrigins));

  const redactResetToken = (url: string) => url
    .replace(/(\/api\/auth\/reset-password\/)[^/?]+/i, '$1[REDACTED]')
    .replace(/([?&](?:reset_token|token|ticket)=)[^&]*/gi, '$1[REDACTED]');
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${redactResetToken(req.url)}`);
    }
    next();
  });

  // AI Studio internal control plane status check
  app.get(["/__aistudio_internal_control_plane/dev/status", "/__aistudio_internal_control_plane/dev/status/", "/dev/status"], (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      status: "ready",
      state: "READY",
      ready: true,
      healthy: true,
      app: "Learn.co",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  let sqlHydrated = false;
  let sqlHydrationError: string | null = null;

  app.get(["/healthz", "/_ah/health"], (_req, res) => {
    res.status(200).send("OK");
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      app: "Learn.co",
      sqlHydrated,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "Learn.co",
      volume: 6,
      auth: "active",
      creatorStudio: "active",
      learningStudio: "active",
      omniCopilot: "active",
      sqlHydrated,
      ...(sqlHydrationError ? { sqlWarmupStatus: "background_retry" } : {}),
      timestamp: new Date().toISOString(),
    });
  });

  // Let the legacy CommonJS routers authenticate tokens issued by
  // /api/auth/signin|signup against the application session store.
  setSessionResolver((token: string) => Database.getSessionUser(token));

  // Start SQL hydration without blocking HTTP port binding so Cloud Run / load balancer
  // probes on / and /health succeed immediately on cold start. Auth routes and session
  // middleware transparently query Cloud SQL on cache miss while hydration finishes.
  const hydrationTask = Database.hydrateFromSql()
    .then(() => {
      sqlHydrated = true;
    })
    .catch((err) => {
      sqlHydrationError = (err as Error)?.message || String(err);
      console.warn("[CloudSQL] Background startup hydration skipped:", sqlHydrationError);
    });
  if (process.env.NODE_ENV === "test") {
    await hydrationTask;
  } else {
    void hydrationTask;
  }

  // Mount API Endpoints
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/practice", practiceRoutes);
  app.use("/api/learning", learningRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api/ai", requireAuth, aiRateLimiter, aiRoutes);
  app.use("/api/creator", creatorRoutes);
  app.use("/api/copilot", requireAuth, copilotRoutes);
  app.use("/api/mentorship", mentorshipRouter);
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/gamification", gamificationRoutes);
  app.use("/api/marketplace", marketplaceRoutes);
  app.use("/api/planner", plannerRoutes);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/study-rooms", studyRoomRoutes);

  // Unknown API paths must return JSON, never the SPA shell.
  app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, error: "API endpoint not found." });
  });

  // Vite middleware for development vs static build for production
  // Centralised error handler. Must be registered after all routes so body-parser
  // failures (malformed JSON), validation errors and thrown exceptions return
  // predictable JSON instead of Express's default HTML stack trace, which leaked
  // file paths and line numbers to clients.
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = Number(err?.status || err?.statusCode) || 500;
    const isClientError = status >= 400 && status < 500;

    if (!isClientError) {
      console.error(`[API Error] ${req.method} ${redactResetToken(req.originalUrl)}:`, redactResetToken(String(err?.message || err)));
    }

    // Avoid leaking internals for 5xx responses.
    const message = isClientError
      ? err?.message || "Invalid request."
      : "An unexpected server error occurred.";

    if (res.headersSent) return;
    res.status(status).json({
      success: false,
      error: message,
      ...(err?.code && isClientError ? { code: err.code } : {}),
    });
  });

  const isCompiledCjs = typeof __filename === "string" && __filename.endsWith("server.cjs");
  if (process.env.NODE_ENV === "test") {
    // API-only mode for integration tests: skip the SPA/static layer.
  } else if (process.env.NODE_ENV !== "production" && !isCompiledCjs) {
    app.get("/sw.js", (_req, res) => {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Service-Worker-Allowed", "/");
      res.sendFile(path.join(process.cwd(), "public", "sw.js"));
    });
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: "spa",
    });
    app.use(async (req, res, next) => {
      const cleanPath = (req.url || '').split('?')[0];
      const isHtmlEntry =
        (req.method === 'GET' || req.method === 'HEAD') &&
        (cleanPath === '/' || cleanPath === '/index.html');
      if (!isHtmlEntry) {
        return next();
      }
      try {
        const templatePath = path.resolve(process.cwd(), 'index.html');
        const template = fs.readFileSync(templatePath, 'utf8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        ensureCsrfCookie(req, res);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.status(200).send(injectNonceIntoHtml(transformed, String(res.locals.cspNonce || '')));
      } catch (err) {
        next(err);
      }
    });
    app.use(vite.middlewares);
  } else {
    mountProductionStatic(app, path.join(process.cwd(), "dist"));
  }

  return app;
}

export async function startServer() {
  const app = await createApp();

  const portArgIndex = process.argv.indexOf("--port");
  const cliPort =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : null;
  const PORT = cliPort || parseInt(process.env.PORT || "3000", 10);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Learn.co Server running on http://0.0.0.0:${PORT}`);
  });
  studyRoomHub.attachWebSocketServer(server);

  server.on("error", (err: any) => {
    console.error(`[Server] Error on port ${PORT}:`, err);
    process.exit(1);
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(async () => {
      try {
        await flushDb();
        process.exit(0);
      } catch (error) {
        console.error('[Server] Failed to flush data during shutdown:', error);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Only boot when executed directly (not when imported by tests).
const isDirectRun =
  process.argv[1] && /server\.(ts|js|cjs|mts)$/.test(process.argv[1]) && !process.env.VITEST;

if (isDirectRun) {
  startServer().catch((error) => {
    console.error('[Server] Startup failed:', error);
    process.exitCode = 1;
  });
}

