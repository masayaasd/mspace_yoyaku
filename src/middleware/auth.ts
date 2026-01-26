import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userLineId: string;
    name?: string | null;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization") ?? req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, config.jwt.secret) as {
      userLineId: string;
      name?: string;
      iat: number;
      exp: number;
    };

    if (!payload.userLineId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      userLineId: payload.userLineId,
      name: payload.name,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
