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

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // JSON payload parser with generous limit for base64 image avatar uploads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
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

  // Mount API Endpoints
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/practice", practiceRoutes);
  app.use("/api/learning", learningRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/creator", creatorRoutes);
  app.use("/api/copilot", copilotRoutes);
  app.use("/api/mentorship", mentorshipRouter);
  app.use("/api/planner", plannerRoutes);
  app.use("/api/analytics", analyticsRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
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

  // Attempt to listen, with fallback to PORT + 1 if EADDRINUSE
  const listenWithFallback = (port: number) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Learn.co Server running on http://localhost:${port}`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        if (port === PORT) {
          console.warn(`[Server] Port ${port} already in use. Trying fallback port ${port + 1}...`);
          listenWithFallback(port + 1);
        } else {
          console.error(`[Server] Port ${port} also in use. Exiting.`);
          process.exit(1);
        }
      } else {
        console.error("[Server] Error:", err);
      }
    });

    return server;
  };

  const server = listenWithFallback(PORT);

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();

