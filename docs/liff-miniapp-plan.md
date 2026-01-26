# LINE Mini App (LIFF) Poker Table Reservation

## Goals
- Deliver a LIFF-based mini app that lets customers browse table availability in a calendar-style UI and complete reservations via the existing backend.
- Maintain seamless hand-off between LIFF UI and Messaging bot flows (e.g., reservation confirmations, reminders).
- Provide admin and customer-facing clarity on table occupancy per time slot.

## Backend Readiness
Existing endpoints to leverage:
- `GET /api/tables`: obtain table metadata for display/filters.
- `GET /api/reservations?start=...&end=...&tableId=...`: fetch reservations per table/date range.
- `POST /api/reservations`: create booking (needs CSRF/auth guard for LIFF usage).
- `PUT /api/reservations/:id`: adjust bookings (future edit flow).
- `GET/PUT /api/templates/reminder`: not directly used by LIFF.

### Backend gaps to address
1. **Authentication**: add LIFF login support by validating `idToken` from LIFF SDK; issue session JWT/CSRF token for API calls.
2. **Availability Endpoint**: expose consolidated availability grid (e.g., `/api/availability?date=2024-05-20`) to reduce client-side computation and avoid over-fetching.
3. **Reservation Duration Options**: define configurable slot length and allowed start times; return from API.
4. **Rate Limiting / Validation**: guard duplicate submissions; server-side schema to accept LIFF payload (name, phone, party size).
5. **CORS**: enable CORS for LIFF domain.
6. **Notification Enrollment**: store `lineUserId` from LIFF profile (requires `profile` scope) for reminders.

### Environment / Config
- `ALLOWED_ORIGINS` に LIFF ミニアプリや運営用UIのOriginを列挙し、CORSを制御する。
- `LINE_LOGIN_CHANNEL_ID` / `LINE_LOGIN_CHANNEL_SECRET` は LINE Developers の「LINEログイン」チャネルから取得し、`/auth/liff` のトークン検証に利用する。

## LIFF Mini App Architecture
- **Framework**: React + Vite (or Next.js if SSR needed) targeting LIFF v2 (SPA embedded in LINE).
- **State Management**: React Query for data fetching & caching of availability; Zustand/Recoil optional for UI state.
- **UI Library**: MUI / Chakra / Tailwind depending on preference; must ensure responsive mobile design.
- **Calendar Component**: use `@fullcalendar/react` or custom grid to represent time slots by table (rows) vs time (columns) or daily schedule view.
- **API Layer**: Axios/fetch wrapper injecting auth headers (JWT) after LIFF login.

### Flow
1. **LIFF Bootstrap**
   - Initialize LIFF with `liff.init({ liffId })`.
   - Call `liff.isLoggedIn()`; if not, `liff.login()`.
   - Retrieve profile (`liff.getProfile()`) and ID token (`liff.getIDToken()`).
   - Send ID token to backend `POST /auth/liff` (new) to verify and get app JWT & stored `lineUserId`.

2. **Calendar Screen**
   - Default to today's date; user can switch dates via date picker.
   - Display table categories as filters (tabs or segmented control).
   - For selected date, call new `/api/availability?date=...` to get booked slots per table; render as colored blocks.
   - Slots show status (available / reserved / pending); selecting available slot opens booking modal.

3. **Booking Modal**
   - Prefill selected table/time, allow duration adjustment.
   - Collect customer name, phone, party size.
   - Submit to `POST /api/reservations` with `lineUserId` from LIFF profile.
   - On success, show confirmation screen + button to send reminder to chat (optional `liff.sendMessages`).

4. **My Reservations Screen** (optional v1.1)
   - `GET /api/reservations?lineUserId=...` (new endpoint) to show upcoming bookings with edit/cancel options.

## Security & Permissions
- Ensure backend verifies LIFF ID token using LINE channel secret before trusting requests.
- Enable `openID` and `profile` scopes in LINE Developers console.
- Use HTTPS endpoint accessible to LINE Platform.

## UI Considerations
- Provide legends for table categories (禁煙/喫煙/VIP) and capacities.
- Calendar view options:
  - **Timeline** (rows: tables, columns: time slots).
  - **Day schedule** (cards per table with time chips).
- Accessibility: large touch targets, color coding with text labels.

## Development Steps
1. **Backend updates**
   - [x] Implement `/api/auth/liff` to validate ID tokens.
   - [x] Add `/api/availability` aggregated endpoint.
   - [x] Add optional query filter `lineUserId` to `GET /api/reservations`.
   - [x] Configure CORS and security middleware.
   - [x] Update Prisma schema (party size、Node-API engine、JWT 認証)。

2. **Mini App scaffold**
   - [x] Create `liff-app/` directory with Vite + React + TypeScript.
   - [x] Install LIFF SDK; set up `.env` with `VITE_LIFF_ID`.
   - [x] Implement auth provider hooking LIFF login & backend token exchange.

3. **Calendar UI**
   - [x] Build availability list UI with date／人数フィルタ。

4. **Booking workflow**
   - [x] Implement inline bookingフォームで入力値検証・POST・エラーハンドリング。
   - [ ] Optionally call `liff.sendMessages` to push confirmation message to chat.

5. **Testing & Deployment**
   - [ ] Unit tests for API clients; integration test with mocked backend.
   - [ ] Cypress/Vitest for calendar interactions.
   - [ ] Deploy backend & mini app; configure LIFF endpoint URL.

## Deployment
- Host backend on service accessible via HTTPS (Heroku/Render/Vercel Functions).
- Serve LIFF app as static assets (Vercel/Netlify). Set LIFF Endpoint URL to production build.

## Future Enhancements
- Support drag-to-resize bookings in calendar UI.
- Admin login within LIFF for on-the-fly edits.
- Real-time updates via WebSocket or Server-Sent Events to reflect new reservations instantly.
- Localized text management via i18n library.
