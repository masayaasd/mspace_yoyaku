import express from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { tableService } from "../services/tableService.js";
import { reservationService } from "../services/reservationService.js";

const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((value) => new Date(`${value}T00:00:00`)),
  partySize: z.coerce.number().int().min(1).default(2),
});

const bookingSchema = z.object({
  tableId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  partySize: z.number().int().min(1),
  name: z.string().min(1),
  phone: z
    .string()
    .regex(/^0\d{9,10}$/)
    .or(z.string().regex(/^\+?[0-9\-]{8,}$/)),
});

const SLOT_START_HOURS = [18, 19, 20, 21];
const SLOT_DURATION_HOURS = 2;

const router = express.Router();

router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const parsed = availabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid parameters" });
      return;
    }

    const { date, partySize } = parsed.data;
    const slots: Array<{
      tableId: string;
      tableName: string;
      startAt: string;
      endAt: string;
      capacityMin: number;
      capacityMax: number;
      isSmoking: boolean;
      displayOrder: number;
    }> = [];

    const tables = await tableService.listTables();

    await Promise.all(
      tables.map(async (table) => {
        // Relaxed rule: no minimum check
        if (partySize > table.capacityMax) {
          return;
        }

        for (const hour of SLOT_START_HOURS) {
          const startTime = new Date(date);
          startTime.setHours(hour, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setHours(endTime.getHours() + SLOT_DURATION_HOURS);

          const conflicts = await reservationService.getAvailability(table.id, startTime, endTime);
          if (conflicts.length === 0) {
            slots.push({
              tableId: table.id,
              tableName: table.name,
              startAt: startTime.toISOString(),
              endAt: endTime.toISOString(),
              capacityMin: table.capacityMin,
              capacityMax: table.capacityMax,
              isSmoking: table.isSmoking,
              displayOrder: table.displayOrder,
            });
          }
        }
      })
    );

    slots.sort((a, b) => {
      if (a.startAt === b.startAt) {
        return a.displayOrder - b.displayOrder;
      }
      return a.startAt.localeCompare(b.startAt);
    });

    res.json({ date: date.toISOString(), partySize, slots });
  })
);

router.post(
  "/book",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid booking payload" });
      return;
    }

    const { tableId, startAt, endAt, partySize, name, phone } = parsed.data;

    try {
      const reservation = await reservationService.createReservation({
        tableId,
        customerName: name,
        customerPhone: phone,
        partySize,
        startTime: startAt,
        endTime: endAt,
        lineUserId: req.user?.userLineId,
        status: "CONFIRMED",
      });

      res.status(201).json({ reservation });
    } catch (error) {
      if (error instanceof Error && error.message.includes("unavailable")) {
        res.status(409).json({ error: "Slot already booked" });
        return;
      }
      if (error instanceof Error && error.message.includes("capacity")) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Could not create reservation" });
    }
  })
);

router.get(
  "/my/reservations",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user?.userLineId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const reservations = await reservationService.listUserReservations(req.user.userLineId);
    res.json({ reservations });
  })
);

export const customerRouter = router;
