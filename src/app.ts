import express from "express";
import path from "path";
import * as fs from "fs";
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
const liffDist = path.join(__dirname, "../liff-app/dist");
console.log("Admin dist path:", adminDist);
console.log("LIFF dist path:", liffDist);
try {
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
// Helper to inject env vars
const injectEnv = (filePath: string, res: Response) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read index.html:", err);
      return res.status(500).send("Internal Server Error");
    }
    const envScript = `
      <script>
        window.__ENV__ = {
          VITE_LIFF_ID: "${process.env.VITE_LIFF_ID || ""}",
          VITE_API_BASE: "${process.env.VITE_API_BASE || ""}"
        };
      </script>
    `;
    const finalHtml = data.replace("</head>", `${envScript}</head>`);
    res.send(finalHtml);
  });
};

app.use("/admin", express.static(adminDist, { index: false }));
app.get("/admin/*", (_req, res) => {
  injectEnv(path.join(adminDist, "index.html"), res);
});

// Routes
app.use("/line", lineRouter);
app.use("/api", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api", customerRouter);

// LIFF App Fallback
app.use(express.static(liffDist, { index: false }));
app.get("*", (req, res, next) => {
  // If it starts with /api or /line, skip (already handled above)
  if (req.path.startsWith("/api") || req.path.startsWith("/line") || req.path.startsWith("/healthz")) {
    return next();
  }
  injectEnv(path.join(liffDist, "index.html"), res);
});

app.post(
  "/scheduler/run-reminders",
  asyncHandler(async (_req, res) => {
    await scheduler.runReminderOnce();
    res.json({ status: "triggered" });
  })
);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (err instanceof Error) {
    console.error("Stack:", err.stack);
    logger.error({ err, stack: err.stack, path: req.path, method: req.method }, "Unhandled error");
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
