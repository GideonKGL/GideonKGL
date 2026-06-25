# API Documentation

Base URL: `/api/v1`

All authenticated endpoints require:

```http
Authorization: Bearer <accessToken>
```

## Authentication

### Register

`POST /auth/register`

Request:

```json
{
  "email": "operator@company.com",
  "password": "StrongPassword123!",
  "firstName": "First",
  "lastName": "Last",
  "phone": "+27110000000"
}
```

Response: `201 Created`

### Password login

`POST /auth/login`

Request:

```json
{
  "email": "operator@company.com",
  "password": "StrongPassword123!"
}
```

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "operator@company.com",
    "roles": ["USER"]
  }
}
```

### PIN login

`POST /auth/pin-login`

Request:

```json
{
  "email": "operator@company.com",
  "pin": "123456"
}
```

### Set PIN

`POST /auth/pin`

Authenticated request:

```json
{
  "pin": "123456"
}
```

### Refresh token

`POST /auth/refresh`

### Password reset request

`POST /auth/password-reset/request`

### Password reset confirm

`POST /auth/password-reset/confirm`

## Users

- `GET /users/me` - current profile.
- `PATCH /users/me` - update current profile.
- `GET /users` - administrator user list.
- `PATCH /users/:id/roles` - administrator role assignment.

## Devices

- `POST /devices` - register mobile device.
- `GET /devices` - list authorized devices.
- `GET /devices/:id` - get device details.
- `PATCH /devices/:id` - update device metadata or active state.

## Locations

- `POST /locations` - create GPS location update.
- `GET /locations/live` - latest location per active device.
- `GET /locations/history?deviceId=&from=&to=` - tracking history.

## Emergency alerts

- `POST /alerts/sos` - trigger SOS.
- `GET /alerts` - list alerts.
- `PATCH /alerts/:id/status` - acknowledge, resolve, or cancel alert.

Statuses:

- `OPEN`
- `ACKNOWLEDGED`
- `RESOLVED`
- `CANCELLED`

## Notifications

- `POST /notifications/register-token` - register FCM token.
- `GET /notifications` - list user notifications.
- `PATCH /notifications/:id/read` - mark notification as read.

## Reports

- `GET /reports/summary?from=&to=` - platform operational summary.

## WebSocket

Socket.IO endpoint: `/socket.io`

Authenticate with:

```ts
io(SOCKET_URL, { auth: { token: accessToken } })
```

Server emits:

- `location.created`
- `sos.created`
- `sos.updated`
- `notification.created`

Clients may emit:

- `device.subscribe` with `{ "deviceId": "..." }`
- `device.unsubscribe` with `{ "deviceId": "..." }`
