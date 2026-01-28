import type { Prisma, Reservation } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const reservationStatusValues = ["CONFIRMED", "CANCELLED", "PENDING"] as const satisfies readonly Reservation["status"][];
const reservationStatusSchema = z.enum(reservationStatusValues);
type ReservationStatus = typeof reservationStatusValues[number];
const CONFIRMED_STATUS: ReservationStatus = "CONFIRMED";
const PENDING_STATUS: ReservationStatus = "PENDING";

const reservationInputSchema = z.object({
  tableId: z.string().uuid(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(5),
  partySize: z.number().int().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: reservationStatusSchema.default(CONFIRMED_STATUS),
  lineUserId: z.string().optional(),
  notes: z.string().optional(),
});

const validDate = z
  .date()
  .refine((d) => !Number.isNaN(d.getTime()), { message: "Invalid date" });

const listSchema = z.object({
  start: validDate.optional(),
  end: validDate.optional(),
  status: reservationStatusSchema.optional(),
  tableId: z.string().uuid().optional(),
});

function overlaps(start: Date, end: Date, existingStart: Date, existingEnd: Date) {
  return start < existingEnd && end > existingStart;
}

async function assertCapacity(tableId: string, partySize: number) {
  const table = await prisma.pokerTable.findUniqueOrThrow({ where: { id: tableId } });
  // Relaxed rule: no minimum check, only maximum check
  if (partySize > table.capacityMax) {
    throw new Error(`人数(${partySize}名)がテーブル定員(${table.capacityMax}名)を超えています`);
  }
  return table;
}

async function assertAvailability(tableId: string, startTime: Date, endTime: Date, excludeId?: string) {
  const conflicts = await prisma.reservation.findMany({
    where: {
      tableId,
      status: { in: [CONFIRMED_STATUS, PENDING_STATUS] },
      NOT: excludeId ? { id: excludeId } : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflicts.length > 0) {
    throw new Error("指定された時間は既に予約が入っています");
  }
}

async function createReservation(input: unknown): Promise<Reservation> {
  const data = reservationInputSchema.parse(input);
  await assertCapacity(data.tableId, data.partySize);
  await assertAvailability(data.tableId, data.startTime, data.endTime);
  return prisma.reservation.create({ data });
}

async function updateReservation(id: string, input: unknown): Promise<Reservation> {
  const data = reservationInputSchema.partial().parse(input);
  const existing = await prisma.reservation.findUniqueOrThrow({ where: { id } });
  const nextStart = data.startTime ?? existing.startTime;
  const nextEnd = data.endTime ?? existing.endTime;
  const nextTableId = data.tableId ?? existing.tableId;
  const nextPartySize = data.partySize ?? existing.partySize;

  // If cancelling, we don't need to check capacity or availability
  if (data.status === "CANCELLED") {
    return prisma.reservation.update({
      where: { id },
      data: {
        ...data,
        // When cancelling, we typically just change the status, but if other fields are passed, we update them too.
        // However, strictly speaking, validity of time/party doesn't matter if cancelled.
      },
    });
  }

  await assertCapacity(nextTableId, nextPartySize);
  await assertAvailability(nextTableId, nextStart, nextEnd, id);

  return prisma.reservation.update({
    where: { id },
    data: {
      ...data,
      startTime: nextStart,
      endTime: nextEnd,
      tableId: nextTableId,
      partySize: nextPartySize,
    },
  });
}

type ReservationWithTable = Prisma.ReservationGetPayload<{ include: { table: true } }>;
type UserReservation = Prisma.ReservationGetPayload<{ include: { table: true } }>;

async function listReservations(filter: unknown): Promise<ReservationWithTable[]> {
  const parsed = listSchema.parse(filter);
  return prisma.reservation.findMany({
    where: {
      tableId: parsed.tableId,
      status: parsed.status as ReservationStatus | undefined,
      startTime: parsed.start ? { gte: parsed.start } : undefined,
      endTime: parsed.end ? { lte: parsed.end } : undefined,
    },
    orderBy: { startTime: "asc" },
    include: { table: true },
  });
}

async function getAvailability(tableId: string, start: Date, end: Date) {
  const reservations = await prisma.reservation.findMany({
    where: {
      tableId,
      status: { in: [CONFIRMED_STATUS, PENDING_STATUS] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  return reservations.map((r) => ({ start: r.startTime, end: r.endTime }));
}

async function listUserReservations(lineUserId: string): Promise<UserReservation[]> {
  if (!lineUserId) {
    console.warn("listUserReservations called with empty lineUserId");
    return [];
  }
  return prisma.reservation.findMany({
    where: {
      lineUserId: lineUserId, // Explicitly set
      status: { in: ["CONFIRMED", "PENDING", "CANCELLED"] },
    },
    orderBy: { startTime: "asc" },
    include: { table: true },
  });
}

export const reservationService = {
  createReservation,
  updateReservation,
  listReservations,
  getAvailability,
  listUserReservations,
  overlaps,
};
