# AquaSense Mobile App

This Flutter app serves both customers and technicians. They use the same sign-in screen; the role returned by the API opens the customer dashboard or the technician dashboard.

Customer features include water usage, water quality, alerts, valve controls, bills, payments, support tickets, and a water meter request form during registration for customers who do not yet have a meter.

Technician features include an assigned-work dashboard, ticket filtering and status updates, read-only device diagnostics, and notifications. Technician accounts are created by an administrator.

Run `flutter pub get`, then `flutter run --dart-define=API_BASE_URL=http://YOUR_BACKEND:4000`.

The seeded technician account is `john.smith@tech.water` / `technician123` after running the backend seed.
