import Handlebars from "handlebars";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";

Handlebars.registerHelper("formatDateTime", (date: Date) => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
});

Handlebars.registerHelper("formatDate", (date: Date) => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
});

Handlebars.registerHelper("formatTime", (date: Date) => {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
});

const DEFAULT_REMINDER_TEMPLATE = {
  title: "ご予約の前日リマインダー",
  body: `ご予約の日は【明日】です。

ご予約内容は以下の通りです。ご来店を心よりお待ちしております。

日程：{{formatDate reservation_date}}
時間：{{formatTime reservation_time}}
予約卓：{{table_name}}

予約の確認・キャンセルは↓こちら↓
{{liff_url}}

電話は↓こちら↓
{{store_phone}}`,
};

const DEFAULT_CONFIRMATION_TEMPLATE = {
  title: "予約確認通知",
  body: `次の内容で予約を承りました。
ご来店お待ちしております。

お名前：{{customer_name}}
電話番号：{{customer_phone}}
ご予約日：{{formatDate reservation_date}}
ご予約時間：{{formatTime reservation_time}}`,
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

  const bodyTemplate = Handlebars.compile(template?.body ?? DEFAULT_REMINDER_TEMPLATE.body);

  return bodyTemplate({
    customer_name: reservation.customerName,
    reservation_date: reservation.startTime,
    reservation_time: reservation.startTime,
    table_name: reservation.table.name,
    liff_url: config.notification.liffBaseUrl ? `${config.notification.liffBaseUrl}/mypage` : "",
    store_phone: config.notification.storePhone,
  });
}

export async function renderConfirmation(reservation: {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: Date;
  table: { name: string };
}) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { type: "CONFIRMATION" },
  });

  const bodyTemplate = Handlebars.compile(template?.body ?? DEFAULT_CONFIRMATION_TEMPLATE.body);

  return bodyTemplate({
    customer_name: reservation.customerName,
    customer_phone: reservation.customerPhone,
    reservation_date: reservation.startTime,
    reservation_time: reservation.startTime,
    table_name: reservation.table.name,
  });
}

