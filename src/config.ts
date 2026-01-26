import "dotenv/config";

const toArray = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  line: {
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? "",
    accessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
    loginChannelId: process.env.LINE_LOGIN_CHANNEL_ID ?? "",
    loginChannelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET ?? "",
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? "",
  },
  cors: {
    allowedOrigins: toArray(process.env.ALLOWED_ORIGINS),
  },
  scheduler: {
    reminderCron: process.env.REMINDER_CRON ?? "0 10 * * *",
  },
};
