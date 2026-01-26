import Handlebars from "handlebars";
import { prisma } from "../lib/prisma.js";

Handlebars.registerHelper("formatDateTime", (date: Date) => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
});

const DEFAULT_TEMPLATE = {
  title: "ご予約の前日リマインダー",
  body: `{{customer_name}}様\n{{reservation_time}}より{{table_name}}のご予約を承っております。\nご来店をお待ちしております。`,
};

export async function renderReminder(reservation: {
  id: string;
  customerName: string;
  startTime: Date;
  table: { name: string };
}) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { type: "REMINDER" },
  });

  const bodyTemplate = Handlebars.compile(template?.body ?? DEFAULT_TEMPLATE.body);

  return bodyTemplate({
    customer_name: reservation.customerName,
    reservation_time: reservation.startTime,
    table_name: reservation.table.name,
  });
}
