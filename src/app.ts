import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import type { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { corsMiddleware } from "./lib/cors.js";
import { lineRouter } from "./routes/line.js";
import { adminRouter } from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import { customerRouter } from "./routes/customer.js";
import { logger } from "./lib/logger.js";
import { scheduler } from "./scheduler/index.js";
import { config } from "./config.js";

export const app = express();

app.use(
  express.json({
    verify: (req: Request, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(corsMiddleware);
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (_req, res) => {
  res.send("ok");
});

app.use("/line", lineRouter);
app.use("/api", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api", customerRouter);

// Static Assets (for production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin App
const adminDist = path.join(__dirname, "../admin-app/dist");
console.log("Admin dist path:", adminDist);
try {
  const fs = await import("fs");
  const adminFiles = fs.readdirSync(adminDist);
  console.log("Admin dist contents:", adminFiles);
  if (adminFiles.includes("assets")) {
    const assetFiles = fs.readdirSync(path.join(adminDist, "assets"));
    console.log("Admin assets contents:", assetFiles);
  }
} catch (e) {
  console.error("Failed to read admin dist:", e);
}
app.use("/admin", express.static(adminDist));
app.get("/admin/*", (_req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});

// LIFF App (Customer App)
const liffDist = path.join(__dirname, "../liff-app/dist");
app.use("/", express.static(liffDist));
app.get("*", (req, res, next) => {
  // If it starts with /api or /line, skip (already handled above)
  if (req.path.startsWith("/api") || req.path.startsWith("/line") || req.path.startsWith("/healthz")) {
    return next();
  }
  res.sendFile(path.join(liffDist, "index.html"));
});

app.post(
  "/scheduler/run-reminders",
  asyncHandler(async (_req, res) => {
    await scheduler.runReminderOnce();
    res.json({ status: "triggered" });
  })
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  if (err instanceof Error) {
    if (err.message === "Party size is outside table capacity" || err.message === "Selected slot is unavailable") {
      res.status(400).json({ error: err.message });
      return;
    }
  }
  res.status(500).json({ error: "Internal server error" });
});

export const startSchedulers = () => {
  scheduler.start(config.scheduler.reminderCron);
};
