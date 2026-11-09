# Smart Water Management Workspace

This VS Code workspace organizes the project into two active user-facing apps and the backend:

- `mobile-app`: shared Flutter app for customers and technicians, with role-based dashboards
- `admin-dashboard`: Next.js admin web dashboard
- `backend`: Nest.js API and device ingestion server

The earlier standalone `technician-app` client has been retired; the combined mobile experience is in `mobile-app`.

The web dashboard and API are separate Node.js applications, so they intentionally
keep separate `package.json` and lock files. The Flutter mobile app has its own
`pubspec.yaml`. Do not merge these manifests: each app has a different runtime,
entry point, and deployment target.

## Suggested build order

1. Start the Nest.js backend.
2. Connect the Next.js admin dashboard to backend APIs.
3. Run the combined Flutter mobile app for customer and technician accounts.

## Current status

This workspace includes a combined customer and technician mobile client, the NestJS API, and the admin dashboard described by the SRS. Flutter SDK is required to run the mobile app.

For the backend architecture, API overview, workflow diagrams, and presentation script, see the [backend presentation guide](docs/backend-presentation-guide.md).

## Open the workspace in VS Code

1. Open `smart-water-management.code-workspace`.
2. Install the recommended extensions.
3. Run dependency installation inside each project folder.
4. Configure production secrets and device integrations before deployment.

## Run from terminal

### Backend

```powershell
cd backend
npm run start:dev
```

### Backend smoke test

```powershell
cd backend
npm run test:smoke
```

### Admin dashboard

```powershell
cd admin-dashboard
npm run dev
```

### Admin dashboard smoke test

```powershell
cd admin-dashboard
npm run test:smoke
```

### Flutter mobile app (customers and technicians)

```powershell
cd mobile-app
flutter pub get
flutter test
flutter run
```

The seeded technician account is `john.smith@tech.water` / `technician123` after running `npm run seed` in `backend`.

The mobile app opens with a **Customer / Technician** choice:

- **Technician** → technician login → technician dashboard with their assigned jobs.
- **Customer with credentials** → customer login → customer dashboard.
- **Customer with an existing meter, first time in the app** → Sign up → “Yes, I have a meter number” → enter the meter number → customer dashboard.
- **Customer without a meter** → Sign up → “No, I need a water meter” → meter request form. The account stays **pending** until an admin registers a device and links it to the customer. After that, the customer logs in normally.

If the mobile app runs on an Android emulator, the default backend base URL is already set to `http://10.0.2.2:4000`.
For another device or platform, pass a custom backend URL:

```powershell
flutter run --dart-define=API_BASE_URL=http://YOUR_IP:4000
```

## Deploy the admin dashboard to Vercel

Deploy `admin-dashboard` as the Vercel project. The repository root is only a
workspace folder; it is not a Next.js application.

1. Push the repository to GitHub and import it in Vercel.
2. In the Vercel project setup, set **Root Directory** to `admin-dashboard`.
3. Keep **Framework Preset** as **Next.js**.
4. Leave the install command as `npm install` (or set it to `npm ci`) and the
   build command as `npm run build`.
5. Add this environment variable in Vercel for Preview and Production:

   ```text
   API_BASE_URL=https://YOUR-BACKEND-DOMAIN.example.com
   ```

6. Deploy. Vercel will use `admin-dashboard/package.json` and
   `admin-dashboard/package-lock.json`.

`API_BASE_URL` must be the public HTTPS URL of the running Nest.js API. Do not
use `localhost` in Vercel; that would point to the Vercel build/runtime machine.

## Deploy the backend separately

The Nest.js backend is a long-running API with Socket.IO and a local SQLite
database. Deploy it to a Node.js host such as Render, Railway, Fly.io, or an
Azure App Service rather than as a normal Vercel Next.js project.

Use these commands on the backend host:

```powershell
cd backend
npm ci
npm run build
npm run start:prod
```

Set `PORT` to the port supplied by the host, `JWT_SECRET` to a long random
secret, and `DB_PATH` to a persistent SQLite path if the host provides a
persistent disk. After the backend is live, copy its HTTPS URL into the
dashboard's Vercel `API_BASE_URL` variable and redeploy the dashboard.
