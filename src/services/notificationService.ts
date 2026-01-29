import { getLineClient } from "../lib/lineClient.js";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { type Prisma, type Reservation, NotificationType } from "@prisma/client";
import { logger } from "../lib/logger.js";

const REMINDER_TYPE = NotificationType.REMINDER;
const CONFIRMATION_TYPE = NotificationType.CONFIRMATION;

async function sendReminder(reservation: Reservation & { lineUserId: string | null }, message: string) {
  if (!reservation.lineUserId) {
    await prisma.notificationLog.create({
      data: {
        reservationId: reservation.id,
        type: REMINDER_TYPE,
        status: "SKIPPED",
        errorMessage: "Missing LINE user id",
        sentAt: new Date(),
      },
    });
    return;
  }

  try {
    const client = await getLineClient();
    await client.pushMessage(reservation.lineUserId, {
      type: "text",
      text: message,
    });

    await prisma.notificationLog.create({
      data: {
        reservationId: reservation.id,
        type: REMINDER_TYPE,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.notificationLog.create({
      data: {
        reservationId: reservation.id,
        type: REMINDER_TYPE,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown",
        sentAt: new Date(),
      },
    });
    throw err;
  }
}

/**
 * 予約確認通知を管理者LINE宛に送信する
 */
async function sendConfirmation(reservation: Reservation, message: string) {
  // Try to get from DB first, fallback to environment variable
  const { settingsService } = await import("./settingsService.js");
  const dbAdminLineUserId = await settingsService.getSetting("ADMIN_LINE_USER_ID");
  const adminLineUserId = dbAdminLineUserId || config.notification.adminLineUserId;

  if (!adminLineUserId) {
    logger.warn({ reservationId: reservation.id }, "Admin LINE user ID not configured, skipping confirmation notification");
    await prisma.notificationLog.create({
      data: {
        reservationId: reservation.id,
        type: CONFIRMATION_TYPE,
        status: "SKIPPED",
        errorMessage: "Admin LINE user ID not configured",
        sentAt: new Date(),
      },
    });
    return;
  }

  try {
    const client = await getLineClient();
    await client.pushMessage(adminLineUserId, {
      type: "text",
      text: message,
    });

    await prisma.notificationLog.create({
      data: {
        reservationId: reservation.id,
        type: CONFIRMATION_TYPE,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    logger.info({ reservationId: reservation.id }, "Confirmation notification sent to admin");
  } catch (err) {
    await prisma.notificationLog.create({
      data: {
        reservationId: reservation.id,
        type: CONFIRMATION_TYPE,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown",
        sentAt: new Date(),
      },
    });
    logger.error({ err, reservationId: reservation.id }, "Failed to send confirmation notification");
    // Don't throw - confirmation is not critical to reservation flow
  }
}

export const notificationService = {
  sendReminder,
  sendConfirmation,
};

