import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";

class SettingsService {
    async getSetting(key: string): Promise<string | null> {
        const setting = await prisma.systemSetting.findUnique({
            where: { key },
        });
        if (setting) return setting.value;

        // Fallback to config (which loads from .env)
        switch (key) {
            case "LINE_CHANNEL_SECRET":
                return config.line.channelSecret;
            case "LINE_CHANNEL_ACCESS_TOKEN":
                return config.line.accessToken;
            case "LINE_LOGIN_CHANNEL_ID":
                return config.line.loginChannelId;
            case "LINE_LOGIN_CHANNEL_SECRET":
                return config.line.loginChannelSecret;
            case "JWT_SECRET":
                return config.jwt.secret;
            default:
                return null;
        }
    }

    async getAllSettings() {
        const keys = [
            "LINE_CHANNEL_SECRET",
            "LINE_CHANNEL_ACCESS_TOKEN",
            "LINE_LOGIN_CHANNEL_ID",
            "LINE_LOGIN_CHANNEL_SECRET",
            "JWT_SECRET",
        ];

        const settings: Record<string, string | null> = {};
        for (const key of keys) {
            settings[key] = await this.getSetting(key);
        }
        return settings;
    }

    async updateSetting(key: string, value: string) {
        return prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
}

export const settingsService = new SettingsService();
