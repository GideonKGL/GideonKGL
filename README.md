# SECURITATEM DEFENSIONIS GUARDIAN TRACKER

Commercial GPS tracking and emergency response platform for Securitatem Defensionis (Pty) Ltd.

Version 1 is organized as an enterprise monorepo:

- `backend` - Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.IO, JWT, RBAC, SOS processing, notifications, audit logging.
- `web` - React, TypeScript, Vite web portal for administration, live tracking, reports, and SOS monitoring.
- `desktop` - Electron, React, TypeScript monitoring console with realtime alerts and alarm playback.
- `mobile` - Flutter, Riverpod, Go Router Android application for registration, login, PIN access, tracking, SOS, notifications, profile, settings, and device registration.
- `docs` - architecture, API, and security documentation.
- `deploy` - Docker and reverse proxy assets.

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker Engine and Docker Compose
- Flutter 3.22+
- PostgreSQL 16+ if running without Docker
- Firebase project for FCM credentials
- Google Maps API key

### Environment

Copy the example environment file and replace values before starting services:

```bash
cp .env.example .env
```

Required production secrets:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- Google Maps keys for web and Android

### Docker platform

```bash
docker compose up --build
```

Services:

- Backend API: `http://localhost:4000`
- Web portal: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

### Backend development

```bash
cd backend
npm install
npm run prisma:generate
npm run migrate
npm run dev
```

### Web portal development

```bash
cd web
npm install
npm run dev
```

### Desktop console development

```bash
cd desktop
npm install
npm run dev
```

### Mobile development

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1 --dart-define=SOCKET_URL=http://10.0.2.2:4000
```

## Database

The canonical schema is in `backend/prisma/schema.prisma`. SQL migrations are generated under `backend/prisma/migrations`.

To initialize a local database:

```bash
cd backend
npm run migrate
npm run seed
```

Default seeded roles:

- `SUPER_ADMIN`
- `ADMIN`
- `DISPATCHER`
- `RESPONDER`
- `USER`

## API documentation

OpenAPI-style endpoint documentation is maintained in `docs/api.md`.

## Security posture

Security controls are documented in `docs/security.md` and include password hashing, JWT authentication, RBAC, request validation, rate limiting, CORS restrictions, audit trails, token revocation support, and emergency-event authorization boundaries.
