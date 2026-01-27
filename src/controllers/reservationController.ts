import { type MessageEvent } from "@line/bot-sdk";
import { z } from "zod";
import { getLineClient } from "../lib/lineClient.js";
import { tableService } from "../services/tableService.js";
import { reservationService } from "../services/reservationService.js";
import { conversationService } from "../services/conversationService.js";
import { logger } from "../lib/logger.js";

function parseDate(input: string) {
  const normalized = input.replace("時", ":").replace("時", ":");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

async function handleProvisionalBooking(event: MessageEvent) {
  if (event.message.type !== "text") return;
  const requestedAt = parseDate(event.message.text.trim());
  if (!requestedAt) {
    const client = await getLineClient();
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "日時の形式が正しくありません。例: 2024-05-10 19:00",
    });
    return;
  }

  const endTime = new Date(requestedAt);
  endTime.setHours(endTime.getHours() + 2);

  const tables = await tableService.listTables();

  const availability = await Promise.all(
    tables.map(async (table) => {
      const conflicts = await reservationService.getAvailability(table.id, requestedAt, endTime);
      return { table, isAvailable: conflicts.length === 0 };
    })
  );

  const availableTables = availability.filter((a) => a.isAvailable);
  if (availableTables.length === 0) {
    const client = await getLineClient();
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "ご指定の時間に空きがありません。他の時間をお試しください。",
    });
    return;
  }

  const text = availableTables
    .map((entry, idx) => `${idx + 1}. ${entry.table.name} (定員${entry.table.capacityMin}-${entry.table.capacityMax}名${entry.table.isSmoking ? " / 喫煙" : " / 禁煙"})`)
    .join("\n");

  const userId = event.source.userId;
  if (userId) {
    await conversationService.setContext(userId, {
      type: "AWAITING_TABLE_SELECTION",
      requestedAt: requestedAt.toISOString(),
      endTime: endTime.toISOString(),
      tableIds: availableTables.map((entry) => entry.table.id),
    });
  }

  const client = await getLineClient();
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `空きがあるテーブルはこちらです:\n${text}\n希望の番号とお名前・電話番号を続けて送信してください。\n例: 1 田中太郎 08012345678`,
  });
}

const confirmationSchema = z.tuple([
  z.coerce.number().min(1),
  z.string().min(1),
  z
    .string()
    .regex(/^0\d{9,10}$/)
    .or(z.string().regex(/^\+?[0-9\-]{8,}$/)),
]);

async function handleConfirmationStep(
  event: MessageEvent,
  context: {
    type: "AWAITING_TABLE_SELECTION";
    requestedAt: string;
    endTime: string;
    tableIds: string[];
  }
) {
  if (event.message.type !== "text") return;
  const payload = event.message.text.trim().split(/\s+/);
  try {
    const [choice, name, phone] = confirmationSchema.parse(payload);
    const tableId = context.tableIds[choice - 1];
    if (!tableId) {
      throw new Error("invalid choice");
    }

    const table = await tableService.getTableById(tableId);

    const reservation = await reservationService.createReservation({
      tableId,
      customerName: name,
      customerPhone: phone,
      partySize: table.capacityMin,
      startTime: context.requestedAt,
      endTime: context.endTime,
      lineUserId: event.source.userId,
    });

    if (event.source.userId) {
      await conversationService.clearContext(event.source.userId);
    }

    const client = await getLineClient();
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: `${reservation.customerName}様、ご予約を承りました。\n${new Date(reservation.startTime).toLocaleString("ja-JP")}からご利用いただけます。`,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to confirm reservation");
    const client = await getLineClient();
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "入力を確認できませんでした。例の形式に従って入力してください (例: 1 田中太郎 08012345678)。",
    });
  }
}

export const reservationController = {
  handleProvisionalBooking,
  handleConfirmationStep,
};
