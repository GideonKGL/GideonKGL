# Securitatem Defensionis Guardian Tracker

Production-ready Flutter Android application for field guardians and worker
safety operations.

## Features

- User login with REST authentication
- 6 digit PIN login and setup
- Biometric login using Android biometrics
- Dashboard with worker safety status
- Live GPS tracking
- Google Maps worker location and geofence overlays
- SOS emergency button
- Geofencing exit event emission
- Worker check-in
- Shift start/end tracking
- Incident reporting with optional camera attachment
- Firebase push notifications and local foreground alerts
- Profile management and logout

## Architecture

The app follows Clean Architecture boundaries:

- `lib/src/core`: configuration, secure storage, REST client, Socket.IO,
  location, permissions, and push notification services.
- `lib/src/features/*/domain`: entities and repository contracts.
- `lib/src/features/*/data`: repository implementations for REST and realtime
  integration.
- `lib/src/features/*/presentation`: Riverpod controllers and Flutter screens.

Riverpod providers inject all infrastructure dependencies into repositories and
controllers. Feature UI depends on controllers rather than REST or platform
services directly.

## Required configuration

Provide the following at build/run time:

```bash
flutter run \
  --dart-define=API_BASE_URL=https://your-api.example.com/v1 \
  --dart-define=SOCKET_URL=https://your-api.example.com \
  --dart-define=GOOGLE_MAPS_API_KEY=your_maps_key
```

Android also requires:

1. `android/local.properties` with `flutter.sdk=/path/to/flutter`.
2. `android/app/google-services.json` from Firebase.
3. `GOOGLE_MAPS_API_KEY` exported in the environment for Gradle manifest
   placeholders, or replace the placeholder in `android/app/build.gradle`.

## Backend contract

The repositories expect these REST routes:

- `POST /auth/login`
- `POST /auth/pin`
- `POST /auth/biometric`
- `POST /auth/pin/setup`
- `POST /auth/logout`
- `GET /users/me`
- `PUT /users/me`
- `GET /geofences/assigned`
- `POST /tracking/live`
- `POST /emergency/sos`
- `POST /workers/check-ins`
- `POST /shifts/start`
- `POST /shifts/{shiftId}/end`
- `POST /geofences/events`
- `POST /incidents`

Socket.IO events emitted by the app:

- `tracking.location`
- `emergency.sos`
- `worker.check_in`
- `shift.started`
- `shift.ended`
- `geofence.exit`
- `incident.reported`

## Verification

When Flutter is installed:

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```
