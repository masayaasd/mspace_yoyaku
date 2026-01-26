import cron from "node-cron";
import { renderReminder } from "../services/templateService.js";
import { reservationService } from "../services/reservationService.js";
import { notificationService } from "../services/notificationService.js";
import { logger } from "../lib/logger.js";

function getNextDayRange(now: Date) {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function runReminderOnceInternal(now: Date = new Date()) {
  const { start, end } = getNextDayRange(now);
  const reservations = await reservationService.listReservations({ start, end, status: "CONFIRMED" });

  for (const reservation of reservations) {
    try {
      const message = await renderReminder(reservation);
      await notificationService.sendReminder(reservation, message);
      logger.info({ reservationId: reservation.id }, "Reminder sent");
    } catch (err) {
      logger.error({ err, reservationId: reservation.id }, "Failed to send reminder");
    }
  }
}

class Scheduler {
  private task: cron.ScheduledTask | null = null;

  start(expression: string) {
    if (this.task) {
      this.task.stop();
    }
    this.task = cron.schedule(expression, () => {
      runReminderOnceInternal().catch((err) => {
        logger.error({ err }, "Scheduled reminder failed");
      });
    });
    this.task.start();
  }

  async runReminderOnce() {
    await runReminderOnceInternal();
  }
}

export const scheduler = new Scheduler();
