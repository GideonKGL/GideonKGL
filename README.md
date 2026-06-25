# Safety Response Backend

Production-ready Node.js backend for user safety workflows. It includes Express.js, PostgreSQL, Prisma ORM, JWT authentication, Firebase Authentication, Socket.IO, device registration, GPS tracking, SOS alerts, incident management, notifications, file uploads, and role-based access control.

## Stack

- Express.js + TypeScript
- PostgreSQL + Prisma ORM
- JWT access tokens
- Firebase Admin token verification
- Socket.IO real-time events
- Zod request validation
- Multer file uploads
- Pino structured logging

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy and fill environment variables:

   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - run the API with hot reload.
- `npm run build` - compile TypeScript.
- `npm start` - run compiled output.
- `npm run typecheck` - type-check without emitting files.
- `npm run prisma:generate` - generate Prisma client.
- `npm run prisma:migrate` - create/apply development migrations.
- `npm run prisma:deploy` - apply production migrations.
- `npm run prisma:studio` - open Prisma Studio.

## Environment

See `.env.example` for all variables. Required production values include:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `CORS_ORIGIN`
- Firebase credentials via `FIREBASE_SERVICE_ACCOUNT_BASE64`, `FIREBASE_SERVICE_ACCOUNT_JSON`, or `GOOGLE_APPLICATION_CREDENTIALS`

## REST API

All endpoints are mounted under `API_PREFIX` (default `/api/v1`).

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/firebase`
- `POST /auth/pin/login`
- `POST /auth/pin/setup`
- `GET /auth/me`

### Users / RBAC

- `GET /users`
- `GET /users/:id`
- `PATCH /users/me`
- `PATCH /users/:id/access`

### Devices

- `POST /devices`
- `GET /devices`
- `PATCH /devices/:id`
- `DELETE /devices/:id`

### GPS Tracking

- `POST /tracking/locations`
- `GET /tracking/locations/me`
- `GET /tracking/locations/me/latest`
- `GET /tracking/users/:userId/locations`
- `GET /tracking/users/:userId/latest`

### SOS Alerts

- `POST /sos`
- `GET /sos`
- `GET /sos/:id`
- `POST /sos/:id/acknowledge`
- `POST /sos/:id/resolve`
- `POST /sos/:id/cancel`

### Incidents

- `POST /incidents`
- `GET /incidents`
- `GET /incidents/:id`
- `PATCH /incidents/:id`
- `POST /incidents/:id/assign`
- `PATCH /incidents/:id/status`

### Notifications

- `GET /notifications`
- `POST /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

### File Uploads

- `POST /uploads` with multipart `files`
- `GET /uploads`
- `GET /uploads/:id`

## Socket.IO Events

Clients authenticate with the same JWT access token in `handshake.auth.token` or an `Authorization: Bearer <token>` header. The server joins clients to `user:<id>` and `role:<role>` rooms.

Published events include:

- `location:updated`
- `sos:created`
- `sos:acknowledged`
- `sos:resolved`
- `sos:cancelled`
- `incident:created`
- `incident:updated`
- `incident:assigned`
- `incident:status_changed`
- `notification:new`
- `device:registered`
- `device:updated`
