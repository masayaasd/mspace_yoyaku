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
  } catch (error) {
    logger.warn(
      {
        err: axios.isAxiosError(error) ? error.toJSON() : error,
      },
      "LIFF authentication failed"
    );
    return res.status(401).json({
      error: "Invalid idToken",
    });
  }
});

export const authRouter = router;
export default router;
