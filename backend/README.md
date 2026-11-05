# Smart Water Management API

The backend is a TypeScript API built with NestJS. It connects the AquaSense mobile app, the admin dashboard, and smart water meter devices to the same data store.

For a presentation-ready walkthrough, see [Backend Presentation Guide](../docs/backend-presentation-guide.md).

## What the backend does

- Authenticates customers, technicians, and administrators.
- Stores customers, technicians, devices, readings, bills, payments, support tickets, alerts, and notifications.
- Receives meter readings and checks them against alert thresholds.
- Serves customer and technician dashboards with data for the signed-in account.
- Tracks support work from customer request through technician assignment and resolution.
- Provides admin routes for managing records and viewing system-wide information.

## How a request is handled

```text
Mobile app / admin dashboard / meter
                 ↓ HTTP request
              Controller
                 ↓ guards and input validation
               Service
                 ↓ TypeORM repository
       SQLite (local) or PostgreSQL
```

Controllers define the HTTP routes. Guards check a login token and, where required, the account role. Services contain the application rules. TypeORM entities describe the tables stored in the database. The global validation pipe handles DTO classes where they are used; it does not automatically validate every inline or `any` request body.

The application module that assembles the feature modules is [`src/app.module.ts`](src/app.module.ts). The server startup and global validation pipe setup are in [`src/main.ts`](src/main.ts).

## Main feature modules

| Module | Responsibility |
| --- | --- |
| `auth` | Login, customer registration, password changes, JWT creation and validation |
| `customers` | Customer records and admin customer management |
| `technicians` | Technician records, assignments, workload and admin technician management |
| `devices` | Meter records, sensor ingestion and valve commands |
| `readings` | Historical and daily sensor readings |
| `alerts` | Sensor threshold alerts and admin acknowledgement |
| `support-tickets` | Customer requests, technician assignment, ticket status and resolution |
| `billing` | Customer bills and admin billing summaries |
| `payments` | Payment records and the Chapa checkout handoff |
| `notifications` | Per-account notifications and read status |
| `audit` | Admin audit log records |

Most feature folders contain a controller, service, and entity. For example, `devices.controller.ts` handles device HTTP requests, `devices.service.ts` contains database operations, and `device.entity.ts` defines the device table.

## Important API routes

All routes use the server root as their base URL. The default local port is `4000`.

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | Confirms the API is running |
| `POST /auth/login` | Public | Signs in a customer or technician and returns a JWT plus role |
| `POST /auth/register` | Public | Creates a customer account; can link an available meter |
| `POST /auth/change-password` | Signed-in user | Changes the current account password |
| `GET /api/mobile/home` | Signed-in customer | Loads the customer dashboard for the account's meter |
| `POST /api/mobile/valve` | Signed-in customer | Requests a change to the linked meter's valve state |
| `POST /api/devices/reading` | Device ingestion | Saves a reading, updates meter state, and checks thresholds |
| `POST /api/mobile/support-tickets` | Customer | Creates a support or water meter request |
| `GET /api/technician/home` | Technician | Returns assigned, accepted, and resolved work counts |
| `GET /api/technician/tickets` | Technician | Lists work assigned to that technician; optional `status` filter |
| `PATCH /api/technician/tickets/:id` | Assigned technician | Accepts, rejects, starts, or resolves a ticket |
| `GET /api/admin/overview` | Admin | Loads system-wide dashboard data |
| `GET /api/admin/devices` | Admin | Lists registered meters |
| `GET /api/admin/support-tickets` | Admin | Lists customer support requests |

Other admin routes manage customers, technicians, bills, payments, readings, alerts, devices, and audit logs. Customer routes also cover bills, payments, readings, notifications, and support ticket history. Technician routes cover their notifications and ticket device diagnostics.

## Authentication and roles

`POST /auth/login` searches customer accounts first and technician accounts second. The password is checked with bcrypt. On success, the API signs a JWT that includes the account ID (`sub`), email, name, and role. Customer tokens also include the linked `meterId`; technician tokens include `technicianId`.

Protected controllers use `JwtAuthGuard`. Routes restricted to a role also use `RolesGuard` and the `@Roles(...)` decorator. The `@CurrentUser()` decorator gives a controller the verified user information from the token.

The unified mobile app reads the returned role to choose the customer dashboard or technician dashboard. Technician accounts are created by an administrator, not through customer self-registration.

## Meter and ticket workflows

### Customer already has a meter

During registration, the API checks that the meter number exists and is not already linked to an account. It creates the customer record and links the device to that customer. The JWT then carries the meter number used by customer dashboard and reading routes.

### Customer needs a meter

The mobile app creates the customer account, then submits a `Water Meter Request` as a support ticket with the installation address and contact number. The support ticket service assigns it to an available technician when possible and creates notifications. The customer can track the request in Support Tickets.

### Technician completes a request

The technician dashboard loads work assigned to the technician's ID. The technician can accept or reject an assigned ticket, then resolve accepted work with resolution notes. Ticket changes notify the customer.

## Sensor ingestion and alerts

The meter simulator or a device sends a reading to `POST /api/devices/reading`. The API stores the reading and updates the meter's latest connectivity, valve state, battery level, and last-seen time. It creates alerts when turbidity is above `5 NTU`, flow is above `30 L/min`, or battery is below `15%`. Water-quality and high-flow alerts can also notify the linked customer.

The thresholds are demo application values in [`src/devices/devices.controller.ts`](src/devices/devices.controller.ts), not a claim that every installation should use the same operational limits.

## Database setup

The database configuration is in [`src/database/database.module.ts`](src/database/database.module.ts):

- If `DATABASE_URL` or `POSTGRES_URL` is set, the backend connects to PostgreSQL. Schema synchronization is disabled in this mode.
- If neither variable is set, the backend uses `better-sqlite3` and `DB_PATH`, defaulting to `./water.sqlite`. TypeORM schema synchronization is enabled in this local mode.

Copy `.env.example` to `.env` for reference. For SQLite development, leave `DATABASE_URL` and `POSTGRES_URL` unset. Set a real `JWT_SECRET` before deploying.

## Run locally

From the `backend` directory:

```powershell
npm ci
npm run start:dev
```

The API listens on port `4000` by default. Set `PORT` to change it. To load sample accounts and data into a disposable local database, open another terminal in `backend` and run:

```powershell
npm run seed
```

The seed script deletes existing records from the demo tables before inserting sample data. Do not run it against a database with data you need to keep.

To simulate meter readings, run `npm run simulate:meters`. With the API running and seeded, run `npm run test:smoke` to exercise health, admin, customer, and technician paths.

Seeded presentation accounts include:

- Admin: `admin2@gmail.com` / `admin123`
- Customer: `mikiasylmer7362@gmail.com` / `customer123`
- Technician: `john.smith@tech.water` / `technician123`

## Prototype notes to explain accurately

- The meter ingestion route currently has no device API-key guard or DTO payload validation. Its controller comment explicitly marks device authentication as a real-deployment requirement.
- Forgot-password currently returns a generic response; it does not issue or deliver a reset token.
- Chapa payment records are saved as pending. A checkout URL is returned only when `CHAPA_CHECKOUT_URL` is configured; this backend does not show a payment callback/verification flow.
- The JWT module has a development fallback secret. Production must set a strong `JWT_SECRET`.
- The PostgreSQL connection currently disables certificate verification. Review that TLS setting for the production host.
- CORS currently allows requests from any origin; restrict origins to the deployed clients for production.
