# System Architecture

## Product

SECURITATEM DEFENSIONIS GUARDIAN TRACKER is a multi-client emergency response and GPS tracking platform owned by Securitatem Defensionis (Pty) Ltd.

## Phase 1: Enterprise architecture

```text
Flutter Android App  ---> REST API ----\
React Web Portal     ---> REST API -----+--> Node.js Express API --> Prisma ORM --> PostgreSQL
Electron Console     ---> REST API ----/
        |                 |
        +---- Socket.IO <-+
        |
Firebase Cloud Messaging
Google Maps Platform
```

## Workspace boundaries

- Backend owns data integrity, authentication, RBAC, tracking ingestion, alert lifecycle, audit logging, and realtime fan-out.
- Mobile owns user registration, password/PIN login UX, device registration, background tracking, SOS trigger, push token registration, settings, and profile workflows.
- Web portal owns administration, dashboards, user/device management, maps, tracking history, reports, and alert monitoring.
- Desktop console owns dispatch-focused monitoring, alert popups, alarm sound, user search, and alert history.
- PostgreSQL owns persistent operational records and auditable history.

## Backend layers

- `config` - runtime configuration, Prisma, logger.
- `middleware` - authentication, RBAC, validation, errors, rate limiting.
- `modules` - domain features with services and controllers.
- `routes` - versioned REST route composition.
- `realtime` - Socket.IO authorization, room management, event fan-out.
- `utils` - shared token, password, pagination, and validation helpers.

## Realtime event model

Authenticated sockets join role/device/user scoped rooms:

- `operations` - dispatch/admin live dashboards.
- `user:{userId}` - user-specific notifications.
- `device:{deviceId}` - device tracking stream.

Events:

- `location.created`
- `sos.created`
- `sos.updated`
- `notification.created`

## Security architecture

- JWT access and refresh tokens signed with separate secrets.
- Passwords hashed with Argon2.
- PINs hashed independently and never stored in plaintext.
- RBAC enforced at route level.
- Zod validates request input.
- Helmet, CORS, compression, JSON body limits, and rate limiting protect public endpoints.
- Audit logs capture security-sensitive operations.
- Database rows include ownership links to support authorization checks.

## Deployment architecture

Docker Compose provisions PostgreSQL, backend API, web portal, and Nginx reverse proxy. The mobile app consumes environment-provided API, Socket.IO, Firebase, and Google Maps configuration at build time.
