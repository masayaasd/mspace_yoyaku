import express from "express";
import { validateSignature, type MessageEvent, type WebhookEvent } from "@line/bot-sdk";
import { config } from "../config.js";
import asyncHandler from "express-async-handler";
import { getLineClient } from "../lib/lineClient.js";
import { settingsService } from "../services/settingsService.js";
import { reservationController } from "../controllers/reservationController.js";
import { conversationService } from "../services/conversationService.js";

const router = express.Router();

router.post(
  "/webhook",
  asyncHandler(async (req, res, next) => {
    const channelSecret = (await settingsService.getSetting("LINE_CHANNEL_SECRET")) || config.line.channelSecret;
    const signature = req.headers["x-line-signature"] as string;

    if (!signature || !validateSignature(JSON.stringify(req.body), channelSecret, signature)) {
      res.status(401).send("Invalid signature");
      return;
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    const events: WebhookEvent[] = req.body.events ?? [];
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  })
);

async function handleEvent(event: WebhookEvent) {
  if (event.type !== "message" || event.message.type !== "text") {
    return;
  }

  const messageEvent = event as MessageEvent;
  const message = messageEvent.message as any;
  const text = message.text.trim();
  const replyToken = messageEvent.replyToken;
  const userId = messageEvent.source.userId;

  if (userId) {
    const context = await conversationService.getContext(userId);
    if (context.type === "AWAITING_TABLE_SELECTION") {
      await reservationController.handleConfirmationStep(messageEvent, context);
      return;
    }
  }

  if (text === "予約" || text === "予約する") {
    const client = await getLineClient();
    await client.replyMessage(replyToken, {
      type: "text",
      text: "ご希望の日付と時間を送信してください (例: 2024-05-10 19:00)",
    });
    return;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    await reservationController.handleProvisionalBooking(messageEvent);
    return;
  }

  const client = await getLineClient();
  await client.replyMessage(replyToken, {
    type: "text",
    text: "予約をご希望の場合は『予約』と入力してください。",
  });
}

export { router as lineRouter };
