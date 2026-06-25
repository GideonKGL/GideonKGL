# Windows Desktop Monitoring Console

Production-ready Electron, React, TypeScript, and Socket.IO desktop console for monitoring field users in real time.

## Features

- Real-time GPS monitoring through Socket.IO events
- Live OpenStreetMap dashboard with user markers and route overlays
- Incoming SOS alert queue with sound and optional desktop notifications
- User search across name, call sign, team, and phone
- Incident lifecycle management
- Evidence viewer with incident filtering and verification state
- Tracking history table for selected users
- Reporting dashboard with live operational metrics
- Secure Electron main/preload boundary with `contextIsolation`
- Windows NSIS packaging via `electron-builder`

## Getting started

```bash
npm install
npm run dev:electron
```

The console connects to `http://localhost:4000` by default. If no backend is available, it enters a degraded/demo mode and simulates GPS/report updates so the UI remains usable.

## Configuration

Create an `.env.local` file to override runtime settings:

```bash
VITE_SOCKET_URL=http://localhost:4000
VITE_DEMO_DATA=true
```

Set `VITE_DEMO_DATA=false` in production if the console should not simulate data when the realtime backend is unavailable.

## Socket.IO event contract

The renderer subscribes to these server events:

- `gps:update`
- `user:upsert`
- `sos:alert`
- `sos:acknowledge`
- `incident:upsert`
- `incident:update-status`
- `evidence:upsert`
- `history:append`
- `reports:update`

Payload types are defined in `src/shared/types.ts`.

## Scripts

```bash
npm run dev              # Vite renderer only
npm run dev:electron     # Electron desktop app with Vite dev server
npm run typecheck        # Renderer and Electron TypeScript checks
npm test                 # Vitest unit tests
npm run build            # Production renderer and Electron build
npm run package          # Windows x64 NSIS installer
npm run package:dir      # Unpacked application directory
```

## Security notes

- Renderer has no Node integration.
- Electron uses a preload script to expose only approved APIs.
- External navigation opens in the system browser.
- CSP is configured in `index.html`; update it if additional trusted map tile or API hosts are introduced.
