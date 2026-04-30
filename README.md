# Smart Water Management Workspace

This VS Code workspace organizes the project into three apps:

- `mobile-app`: Flutter customer app
- `admin-dashboard`: Next.js admin web dashboard
- `backend`: Nest.js API and device ingestion server

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
