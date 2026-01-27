import { Router } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { settingsService } from "../services/settingsService.js";

const router = Router();

type VerifyResponse = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  exp: number;
};

router.post("/liff", async (req, res) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      return res.status(400).json({ error: "idToken required" });
    }

    const verifyUrl = "https://api.line.me/oauth2/v2.1/verify";

    const loginChannelId = await settingsService.getSetting("LINE_LOGIN_CHANNEL_ID");
    const jwtSecret = await settingsService.getSetting("JWT_SECRET");

    const { data } = await axios.post<VerifyResponse>(verifyUrl, new URLSearchParams({
      id_token: idToken,
      client_id: loginChannelId ?? config.line.loginChannelId,
    }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const userLineId = data.sub;
    const name = data.name;

    const token = jwt.sign({ userLineId, name }, jwtSecret ?? config.jwt.secret, {
      expiresIn: "15m",
    });

    res.json({
      token,
      expiresIn: 15 * 60,
      profile: {
        userId: userLineId,
        name: name ?? null,
        email: data.email ?? null,
        picture: data.picture ?? null,
      },
    });
  } catch (error: any) {
    logger.warn(
      {
        err: axios.isAxiosError(error) ? error.toJSON() : error,
      },
      "LIFF authentication failed"
    );

    // Auto-Diagnosis for 401
    let detailMessage = "Please check LINE_LOGIN_CHANNEL_ID configuration";
    let backendId = loginChannelId ?? config.line.loginChannelId;

    try {
      const decoded = jwt.decode(idToken || "") as any;
      if (decoded && decoded.aud) {
        const frontendId = decoded.aud;
        if (frontendId !== backendId) {
          detailMessage = `ID Mismatch! App uses ${frontendId}, Backend expects ${backendId || "(Not Set)"}`;
        }
      }
    } catch (e) {
      // ignore decode error
    }

    // Extract meaningful error message
    let errorMessage = "Authentication failed";
    if (axios.isAxiosError(error) && error.response?.data) {
      const lineError = error.response.data as any;
      errorMessage = `LINE API Error: ${lineError.error_description || lineError.error || "Unknown"}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(401).json({
      error: errorMessage,
      return res.status(401).json({
        error: errorMessage,
        detail: detailMessage
      });
    }
});

export const authRouter = router;
export default router;
