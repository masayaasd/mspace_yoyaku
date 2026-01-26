import { config } from "../src/config.js";

function req(name: string, val: unknown) {
  const missing =
    val === "" ||
    val === undefined ||
    (Array.isArray(val) && val.length === 0);
  if (missing) {
    throw new Error(`Missing ENV: ${name}`);
  }
}

try {
  req("PORT", config.port);
  req("DATABASE_URL", config.dbUrl);
  req("LINE_CHANNEL_SECRET", config.line.channelSecret);
  req("LINE_CHANNEL_ACCESS_TOKEN", config.line.accessToken);
  req("LINE_LOGIN_CHANNEL_ID", config.line.loginChannelId);
  req("LINE_LOGIN_CHANNEL_SECRET", config.line.loginChannelSecret);
  req("JWT_SECRET", config.jwt.secret);
  console.log("ENV OK");
  process.exit(0);
} catch (error) {
  console.error("Environment configuration error:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
