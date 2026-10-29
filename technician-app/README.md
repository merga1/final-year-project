# AquaSense Technician App

This is the technician Flutter client described in the SRS. It authenticates technician accounts created by the admin, lists assigned tickets, supports accept/reject/resolve transitions, exposes read-only device diagnostics, and displays technician notifications.

The repository keeps the app source separate from the customer app while both clients use the same NestJS backend. To generate platform runners for a local checkout, run `flutter create .` inside this directory, then `flutter pub get` and `flutter run --dart-define=API_BASE_URL=http://YOUR_BACKEND:4000`.

Seeded demo credentials are `john.smith@tech.water` / `technician123` after running the backend seed.
