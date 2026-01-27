import cors from "cors";
import { config } from "../config.js";
import { logger } from "./logger.js";

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = config.cors.allowedOrigins;
    // Allow Vercel deployments automatically
    if (origin.endsWith(".vercel.app") || origin.endsWith("localhost:5173")) {
      return callback(null, true);
    }
    const ok = allowed.includes(origin);
    if (!ok) {
      logger.warn({ origin }, "Blocked by CORS");
    }
    return callback(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  credentials: true,
});
