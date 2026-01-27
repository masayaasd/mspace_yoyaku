import { getLineClient } from "../lib/lineClient.js";
import { prisma } from "../lib/prisma.js";
import { type Prisma, type Reservation, NotificationType } from "@prisma/client";
const REMINDER_TYPE = NotificationType.REMINDER;

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

export const notificationService = {
  sendReminder,
};
