import express from "express";
import asyncHandler from "express-async-handler";
import { reservationService } from "../services/reservationService.js";
import { tableService } from "../services/tableService.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { settingsService } from "../services/settingsService.js";
import { adminAuthService } from "../services/adminAuthService.js";

const router = express.Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await adminAuthService.login(username, password);
    if (!result) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.json(result);
  })
);

router.get(
  "/reservations",
  asyncHandler(async (req, res) => {
    const { start, end, status, tableId } = req.query;
    const filter = {
      start: start ? new Date(String(start)) : undefined,
      end: end ? new Date(String(end)) : undefined,
      status: status ? String(status) : undefined,
      tableId: tableId ? String(tableId) : undefined,
    };
    const reservations = await reservationService.listReservations(filter);
    res.json(reservations);
  })
);

router.post(
  "/reservations",
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (!payload.partySize && payload.tableId) {
      const table = await tableService.getTableById(String(payload.tableId));
      payload.partySize = table.capacityMin;
    }
    const reservation = await reservationService.createReservation(payload);
    res.status(201).json(reservation);
  })
);

router.put(
  "/reservations/:id",
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (!payload.partySize) {
      const existing = await prisma.reservation.findUniqueOrThrow({ where: { id: req.params.id } });
      payload.partySize = existing.partySize;
    }
    const reservation = await reservationService.updateReservation(req.params.id, payload);
    res.json(reservation);
  })
);

router.get(
  "/tables",
  asyncHandler(async (_req, res) => {
    const tables = await tableService.listTables();
    res.json(tables);
  })
);

const templateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  enabled: z.boolean().optional(),
});

router.get(
  "/templates/reminder",
  asyncHandler(async (_req, res) => {
    const template = await prisma.notificationTemplate.findUnique({ where: { type: "REMINDER" } });
    res.json(template ?? null);
  })
);

router.put(
  "/templates/reminder",
  asyncHandler(async (req, res) => {
    const parsed = templateSchema.parse(req.body);
    const template = await prisma.notificationTemplate.upsert({
      where: { type: "REMINDER" },
      update: parsed,
      create: { ...parsed, type: "REMINDER" },
    });
    res.json(template);
  })
);

// Confirmation Template (for LIFF sendMessages)
router.get(
  "/templates/confirmation",
  asyncHandler(async (_req, res) => {
    try {
      const template = await prisma.notificationTemplate.findUnique({ where: { type: "CONFIRMATION" } });
      if (template) {
        res.json(template);
        return;
      }
    } catch (err) {
      console.error("Failed to fetch confirmation template:", err);
      // Fallback to default
    }

    // Return default if not found or error
    res.json({
      title: "予約確認",
      body: `次の内容で予約を承りました。
ご来店お待ちしております。

お名前：{{customer_name}}
電話番号：{{customer_phone}}
ご予約日：{{reservation_date}}
ご予約時間：{{reservation_time}}`,
      enabled: true
    });
  })
);

router.put(
  "/templates/confirmation",
  asyncHandler(async (req, res) => {
    const parsed = templateSchema.parse(req.body);
    const template = await prisma.notificationTemplate.upsert({
      where: { type: "CONFIRMATION" },
      update: parsed,
      create: { ...parsed, type: "CONFIRMATION" },
    });
    res.json(template);
  })
);

// Notification Settings (LIFF URL, Store Phone)
router.get(
  "/settings/notification",
  asyncHandler(async (_req, res) => {
    const liffUrl = await settingsService.getSetting("LIFF_BASE_URL");
    const storePhone = await settingsService.getSetting("STORE_PHONE");
    const adminLineUserId = await settingsService.getSetting("ADMIN_LINE_USER_ID");
    res.json({
      liffBaseUrl: liffUrl ?? "",
      storePhone: storePhone ?? "070-8328-6648",
      adminLineUserId: adminLineUserId ?? ""
    });
  })
);

router.put(
  "/settings/notification",
  asyncHandler(async (req, res) => {
    const { liffBaseUrl, storePhone, adminLineUserId } = req.body;
    if (typeof liffBaseUrl === "string") {
      await settingsService.updateSetting("LIFF_BASE_URL", liffBaseUrl);
    }
    if (typeof storePhone === "string") {
      await settingsService.updateSetting("STORE_PHONE", storePhone);
    }
    if (typeof adminLineUserId === "string") {
      await settingsService.updateSetting("ADMIN_LINE_USER_ID", adminLineUserId);
    }
    res.json({ status: "success" });
  })
);

// Settings
router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  })
);

router.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        await settingsService.updateSetting(key, value);
      }
    }
    res.json({ status: "success" });
  })
);

// Dashboard stats
router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalReservations = await prisma.reservation.count({
      where: {
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: { not: "CANCELLED" }
      }
    });

    const activeReservations = await prisma.reservation.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        status: { in: ["CONFIRMED", "PENDING"] }
      },
      select: { tableId: true }
    });
    const activeTableIds = new Set(activeReservations.map(r => r.tableId));
    const activeTables = activeTableIds.size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayReservations = await prisma.reservation.count({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: { not: "CANCELLED" }
      },
    });

    const recentActivity = await prisma.reservation.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { table: true }
    });

    res.json({
      totalReservations,
      activeTables,
      todayReservations,
      recentActivity,
    });
  })
);

// Test reminder endpoint with detailed results
router.post(
  "/reminders/test",
  asyncHandler(async (_req, res) => {
    const { reservationService } = await import("../services/reservationService.js");
    const { notificationService } = await import("../services/notificationService.js");
    const { renderReminder } = await import("../services/templateService.js");

    // Calculate Tomorrow in JST
    const now = new Date();
    // Assuming server is UTC, add 9 hours to get JST equivalent time
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const jstTomorrow = new Date(jstNow);
    jstTomorrow.setDate(jstTomorrow.getDate() + 1);
    jstTomorrow.setHours(0, 0, 0, 0); // JST Tomorrow 00:00

    const start = new Date(jstTomorrow.getTime() - 9 * 60 * 60 * 1000); // Back to UTC
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);    // Back to UTC end of day

    const debugInfo = {
      serverTime: now.toISOString(),
      jstTomorrow: jstTomorrow.toISOString(),
      searchStartUTC: start.toISOString(),
      searchEndUTC: end.toISOString()
    };

    const reservations = await reservationService.listReservations({ start, end, status: "CONFIRMED" });

    const results: any[] = [];
    for (const reservation of reservations) {
      try {
        const message = await renderReminder(reservation);
        await notificationService.sendReminder(reservation, message);
        results.push({
          id: reservation.id,
          customerName: reservation.customerName,
          lineUserId: reservation.lineUserId ? "あり" : "なし",
          status: "sent"
        });
      } catch (err: any) {
        results.push({
          id: reservation.id,
          customerName: reservation.customerName,
          lineUserId: reservation.lineUserId ? "あり" : "なし",
          status: "failed",
          error: err.message
        });
      }
    }

    res.json({
      status: "success",
      targetDate: start.toISOString().split('T')[0],
      reservationCount: reservations.length,
      results
    });
  })
);

export { router as adminRouter };

