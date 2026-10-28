# Smart Water Management Workspace

This VS Code workspace organizes the project into three apps:

- `mobile-app`: Flutter customer app
- `admin-dashboard`: Next.js admin web dashboard
- `backend`: Nest.js API and device ingestion server

The web dashboard and API are separate Node.js applications, so they intentionally
keep separate `package.json` and lock files. The Flutter mobile app has its own
`pubspec.yaml`. Do not merge these manifests: each app has a different runtime,
entry point, and deployment target.

## Suggested build order

1. Start the Nest.js backend.
2. Connect the Next.js admin dashboard to backend APIs.
3. Connect the Flutter mobile app to the same backend.

## Current status

This workspace includes a starter structure, base files, and VS Code configuration.
Framework dependencies are installed for `backend` and `admin-dashboard`.
Flutter SDK is still required to run or test `mobile-app`.

## Next steps in VS Code

1. Open `smart-water-management.code-workspace`.
2. Install the recommended extensions.
3. Run dependency installation inside each project folder.
4. Start implementing auth, devices, readings, billing, alerts, and support modules.

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

### Flutter mobile app

```powershell
cd mobile-app
flutter create .
flutter test
flutter run
```

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
