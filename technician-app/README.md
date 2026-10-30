# AquaSense Technician App

This is the technician Flutter client described in the SRS. It authenticates technician accounts created by the admin, lists assigned tickets, supports accept/reject/resolve transitions, exposes read-only device diagnostics, and displays technician notifications.

The repository keeps the app source separate from the customer app while both clients use the same NestJS backend. Run `flutter pub get`, then `flutter run --dart-define=API_BASE_URL=http://YOUR_BACKEND:4000`.

Seeded demo credentials are `john.smith@tech.water` / `technician123` after running the backend seed.
