# Smart Water Management API

NestJS (TypeScript) backend for the AquaSense system. One API serves the customer/technician mobile app, the admin dashboard, and the ESP32 smart water meters.

## Quick start

```bash
npm ci
cp .env.example .env        # then edit JWT_SECRET (and DEVICE_API_KEY if you use one)
npm run start:dev           # http://localhost:4000, SQLite file created automatically
npm run seed                # (new terminal) demo accounts + data - wipes the demo tables
npm run simulate:meters     # (optional) fake meters posting a reading every 60 s
npm run test:smoke          # end-to-end checks against the running, seeded API
```

Demo accounts (created by `npm run seed`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin2@gmail.com` | `admin123` |
| Customer | `mikiasylmer7362@gmail.com` | `customer123` |
| Technician | `john.smith@tech.water` | `technician123` |

## Architecture

```text
Mobile app / Admin dashboard / ESP32 meter
              | HTTP
        Controller   (routes, JwtAuthGuard + RolesGuard, DTO validation)
              |
        Service      (business rules)
              |
        TypeORM repository -> SQLite (local) or PostgreSQL (production)
```

| Folder | Responsibility |
| --- | --- |
| `src/auth` | Login, registration, password change, JWT strategy, guards, `@Roles`, `@CurrentUser` |
| `src/customers`, `src/technicians` | Accounts and admin management |
| `src/devices` | Meters, valve commands, telemetry ingestion + threshold alerts |
| `src/readings` | Reading history and chart aggregations |
| `src/alerts` | Alert list and acknowledgement |
| `src/support-tickets` | Request -> admin assigns -> technician accepts/resolves |
| `src/billing`, `src/payments` | Bills and pending payments (Chapa hand-off) |
| `src/notifications`, `src/audit` | Per-user notifications, admin audit log |
| `src/config/env.ts` | The only place environment variables are read and validated |
| `src/app.config.ts` | CORS + global ValidationPipe, shared by `main.ts` and `api/index.js` |
| `src/database` | Database module and seed script |

## Key rules

- **Roles come only from the database.** Admin routes need `role = admin`; there are no special-cased emails.
- **Device ingestion** (`POST /api/devices/reading`) requires the `x-device-key` header matching `DEVICE_API_KEY`. If the variable is unset it is open in development and *rejected* in production.
- **Alerts** are raised when turbidity > 5 NTU, flow > 30 L/min or battery < 15 % (`src/devices/devices.constants.ts`); the same alert type is not repeated for 30 minutes.
- **Payments** created by customers are always `pending`; a referenced bill must belong to the caller and the bill's own amount is charged.
- **Every request body** is validated by a DTO class (`whitelist: true` removes unknown fields).

## Database

- `DATABASE_URL` (or `POSTGRES_URL`) set -> PostgreSQL. Tables are created only when `DB_SYNC=true` (set it once, then remove it). `DB_SSL` = `disable | require | verify`.
- Not set -> SQLite file at `DB_PATH` (default `./water.sqlite`), schema auto-synchronised.
- `npm run seed` refuses to run against PostgreSQL unless `SEED_CONFIRM=yes`.

## Deployment (Vercel)

`vercel.json` routes everything to `api/index.js`, which loads the compiled app from `dist/`. Serverless has no persistent disk, so **a PostgreSQL `DATABASE_URL` is required**. Set `NODE_ENV=production`, `JWT_SECRET`, `DEVICE_API_KEY` and `CORS_ORIGINS` in the project settings.

## Known limitations (prototype)

- Forgot-password returns a generic message; no reset token is sent.
- Chapa payments stay `pending`; there is no callback/verification endpoint yet.
- Valve commands are confirmed immediately (no real device acknowledgement).
- `BillingService.generateFromCumulativeReadings` exists but no route/scheduler calls it yet.
- No automated unit tests; `npm run test:smoke` is the only check.
- `socket.io` / `@nestjs/websockets` / `@nestjs/platform-socket.io` are installed but unused; remove with
  `npm uninstall socket.io @nestjs/websockets @nestjs/platform-socket.io`.
