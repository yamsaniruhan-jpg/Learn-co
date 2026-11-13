import "dotenv/config";
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
// Legacy CommonJS routers. Their folders are marked `"type": "commonjs"`, so
// these default imports resolve in dev (ESM + tsx) and in the bundled CJS build.
import subscriptionRoutes from "./routes/subscription";
import gamificationRoutes from "./routes/gamification";
import marketplaceRoutes from "./routes/marketplace";
import { setSessionResolver } from "./middleware/auth";
import { Database } from "./server/db";
import cors from "cors";
import cookieParser from "cookie-parser";
import securityHeaders from "./server/middleware/securityHeaders";
import { requireAuth } from "./server/middleware/authMiddleware";
import aiRateLimiter from "./server/middleware/aiRateLimit";

/**
 * Builds the fully-wired Express application without binding a port.
 * Exported so integration tests can exercise the real route stack.
 */
export async function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  // Last-resort safety net: a rejected promise from an optional integration
  // (Firestore, Gemini, Stripe, SMTP) must never take the HTTP server down.
  process.on("unhandledRejection", (reason: any) => {
    console.error("[Server] Unhandled promise rejection:", reason?.message || reason);
  });
  process.on("uncaughtException", (err: any) => {
    console.error("[Server] Uncaught exception:", err?.message || err);
  });

  // ORDER MATTERS — security first
  app.use(securityHeaders);

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        if (
          origin === "https://learn-co.ai.studio" ||
          origin === "http://localhost:3000" ||
          origin.endsWith(".run.app") ||
          origin.endsWith(".google.com") ||
          origin.endsWith(".aistudio.google.com")
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive fallback for preview environments
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsers with payload limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Cookie parser
  app.use(cookieParser());

  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.url}`);
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

  app.get(["/healthz", "/_ah/health"], (req, res) => {
    res.status(200).send("OK");
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
      timestamp: new Date().toISOString(),
    });
  });

  // Let the legacy CommonJS routers authenticate tokens issued by
  // /api/auth/signin|signup against the application session store.
  setSessionResolver((token: string) => Database.getSessionUser(token));

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
      console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err?.message || err);
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

  if (process.env.NODE_ENV === "test") {
    // API-only mode for integration tests: skip the SPA/static layer.
  } else if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

async function startServer() {
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

  server.on("error", (err: any) => {
    console.error(`[Server] Error on port ${PORT}:`, err);
    process.exit(1);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Only boot when executed directly (not when imported by tests).
const isDirectRun =
  process.argv[1] && /server\.(ts|js|cjs|mts)$/.test(process.argv[1]) && !process.env.VITEST;

if (isDirectRun) {
  startServer();
}

