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

// Static client removed to enforce dynamic configuration via getLineClient()
