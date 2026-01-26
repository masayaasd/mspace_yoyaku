# LINE Reservation System Architecture

## Overview

The service runs as a Node.js (TypeScript) application that exposes both a LINE Messaging webhook and REST APIs for internal management. SQLite (via Prisma ORM) persists reservation data, table metadata, and notification templates. A lightweight admin web client consumes the REST APIs to review and modify reservations. Scheduled background jobs deliver reminder notifications via the LINE Messaging API.

```
LINE Platform ---> Webhook Handler ---> Reservation Service ---> SQLite
                                   \-> Notification Scheduler ---> LINE Push API
Admin SPA ------> REST Admin API ---/
```

## Components

- **Webhook API (`/line/webhook`)**  
  Receives user messages/events from LINE. Orchestrates conversational flows to capture reservation details, validates availability, and confirms bookings.

- **Reservation Service (domain layer)**  
  Encapsulates table lookup, slot availability checks, conflict detection, booking creation, updates, and cancellation logic.

- **Notification Scheduler**  
  Runs periodic jobs (cron) that scan for next-day bookings and sends configurable reminder messages via LINE push messages.

- **Admin REST API (`/api/...`)**  
  Allows operators to list reservations, filter by table/date, update bookings, override availability, and manage notification templates.

- **Admin SPA**  
  Minimal React/Next.js client served separately (future work). Provides calendar-like visualization and management UI by consuming the REST endpoints.

## Data Model

### Tables
- `PokerTable`  
  - `id` (string UUID)  
  - `name` (e.g., "NonSmoking-9p-1")  
  - `category` enum (`NONSMOKING_9`, `NONSMOKING_6`, `SMOKING_9`, `SMOKING_4_6`, `VIP`)  
  - `capacity_min`, `capacity_max`  
  - `is_smoking` boolean  
  - `display_order` for calendar rendering  

- `Reservation`  
  - `id` (string UUID)  
  - `tableId` FK → `PokerTable`  
  - `customer_name`  
  - `customer_phone`  
  - `line_user_id` (nullable)  
  - `start_time`, `end_time` (ISO timestamps)  
  - `status` enum (`CONFIRMED`, `CANCELLED`, `PENDING`)  
  - `notes` (operator comments)  
  - `created_at`, `updated_at`

- `NotificationTemplate`  
  - `id`  
  - `type` enum (`REMINDER`)  
  - `title`  
  - `body` (supports template variables like `{{customer_name}}`, `{{reservation_time}}`, `{{table_name}}`)  
  - `enabled`

- `NotificationLog`  
  - `id`  
  - `reservationId`  
  - `type`  
  - `sent_at`  
  - `status` (`SENT`, `FAILED`)  
  - `error_message`

## Reservation Flow (Customer)
1. Customer adds the store's LINE Official Account.
2. Customer sends message / taps rich menu entry to start booking.
3. Bot prompts for date/time, table preference, and party size (optional). Uses postback actions for quick selection.
4. Application checks availability:
   - Query reservations for the chosen table and detect overlaps (`start_time < existing_end && end_time > existing_start`).
   - If unavailable, present alternatives (same category different table or adjacent times).
5. Customer provides name and phone number.
6. Bot generates reservation, stores it, and sends a Flex Message confirmation with calendar icon and quick actions (view, change, cancel).

## Admin Capabilities
- View aggregated calendar per day/table (REST endpoint `GET /api/reservations?date=...` returning timeslots).
- Create/update/cancel bookings on behalf of customers.
- Override availability and add internal notes.
- Manage reminder template text (`PUT /api/templates/reminder`).
- Trigger manual reminders.

## Notification Strategy
- Nightly cron job (e.g., `0 10 * * *` JST) fetches reservations starting the next day.
- For each reservation:
  - Render template with `mustache`/`handlebars`.
  - Send push message via LINE Messaging API (requires storing provider access token).
  - Log result in `NotificationLog`.

## Calendar Representation
- Timeslots stored as start/end `DateTime`.
- API returns normalized intervals (e.g., 30-minute increments) for UI.
- LINE bot provides quick reply to "check availability" by listing tables and open slots for a selected date.

## Environment & Config
- `.env` values:  
  - `PORT`  
  - `DATABASE_URL` (SQLite path)  
  - `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`  
  - `REMINDER_CRON`  

## Extensibility
- Extend `NotificationTemplate` for SMS or email reminders.
- Plug in Firestore or Postgres instead of SQLite (Prisma reconfiguration).
- Introduce OAuth for admin UI.
- Add analytics endpoints (table utilization).

