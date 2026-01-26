import { Client, ClientConfig } from "@line/bot-sdk";
import { config } from "../config.js";
import { settingsService } from "../services/settingsService.js";

export const getLineClient = async () => {
  const channelSecret = await settingsService.getSetting("LINE_CHANNEL_SECRET");
  const accessToken = await settingsService.getSetting("LINE_CHANNEL_ACCESS_TOKEN");

  return new Client({
    channelSecret: channelSecret ?? config.line.channelSecret,
    channelAccessToken: accessToken ?? config.line.accessToken,
  } satisfies ClientConfig);
};

// For backward compatibility where it's used as 'client'
export const client = new Client({
  channelSecret: config.line.channelSecret,
  channelAccessToken: config.line.accessToken,
} satisfies ClientConfig);
