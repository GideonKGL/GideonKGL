# Emergency Response System

This repository contains an Android-compliant emergency response implementation in Kotlin.

## Emergency triggers

- **SOS button**: explicit user action in `MainActivity`.
- **Volume Up pressed 7 times**: detected while the app activity is foregrounded through `dispatchKeyEvent`.
- **Device shake detection**: accelerometer listener while the app is foregrounded or while the visible foreground monitoring service is active.
- **Geofence violation**: evaluated from location updates while the visible foreground monitoring service is active.

Android does not allow apps to silently monitor hardware buttons, sensors, or continuous background location without user-visible affordances. Background shake/geofence monitoring therefore runs only through `EmergencyTrackingService`, a foreground service with a persistent notification.

## Emergency response flow

Every trigger is routed through `EmergencyCoordinator`:

1. Log the trigger to app-private JSONL logs.
2. Capture the current location if foreground location permission is granted.
3. Send an alert to the backend with `createIncident=true` and `notifyDesktopConsole=true`.
4. Persist the active emergency/incident IDs.
5. Start foreground emergency tracking.
6. Send location updates every 5 seconds while the emergency is active.
7. Upload app-private or user-registered evidence if read permission is available.
8. Log success/failure events for each step.

## Backend contract

Configure `app/src/main/res/values/strings.xml`:

```xml
<string name="emergency_backend_base_url">https://your-backend.example/api</string>
```

Expected endpoints:

- `POST /emergency/alerts`
  - Creates the incident automatically.
  - Pushes a notification to the desktop console when `notifyDesktopConsole=true`.
  - Returns JSON such as:

```json
{
  "emergencyId": "uuid",
  "incidentId": "incident-123",
  "accepted": true
}
```

- `POST /emergency/tracking`
  - Receives 5-second tracking updates tied to `emergencyId` and `incidentId`.

- `POST /emergency/evidence`
  - Receives multipart evidence tied to the active emergency.

## Privacy and platform compliance

- Location, media, and notification permissions are requested at runtime.
- Background location is not bundled into the foreground permission request; the UI opens app settings so the user can grant it deliberately.
- Continuous background monitoring uses a foreground service and a persistent notification.
- Volume-button detection is foreground-only; Android restricts global background key interception.
- Evidence upload is opt-in: app-private evidence files or user-selected document URIs are uploaded. The app does not scrape the media library.
- Emergency logs are stored in app-private storage and excluded from backup/data extraction.
- Cleartext traffic is disabled in the manifest.

## Build

The project uses Android Gradle Plugin 9.2.1 and Kotlin 2.4.0.

```bash
gradle :app:assembleDebug
```
