# Security Documentation

## Authentication

- Access and refresh tokens use different HMAC secrets and lifetimes.
- Password credentials are hashed with Argon2id.
- PIN credentials are hashed separately and must be six digits.
- Refresh tokens are persisted as hashed token identifiers to support revocation.

## Authorization

Role Based Access Control is enforced by middleware:

- `SUPER_ADMIN` - unrestricted tenant administration.
- `ADMIN` - administrative management.
- `DISPATCHER` - monitoring and alert operations.
- `RESPONDER` - emergency response workflows.
- `USER` - self-service mobile workflows.

## Data protection

- Secrets are provided through environment variables.
- API responses omit password hashes, PIN hashes, reset tokens, and refresh token hashes.
- Location history access is restricted to operations roles or the owning user/device.
- Audit logs are append-only through service APIs.

## Network and application controls

- Helmet applies secure HTTP headers.
- CORS is allow-list based.
- Rate limiting protects authentication and API endpoints.
- Request bodies are size-limited.
- Zod schemas validate request input before domain logic.
- Prisma parameterizes SQL queries.

## Production checklist

- Configure TLS at the load balancer or reverse proxy.
- Use managed PostgreSQL with backups, point-in-time recovery, and encrypted volumes.
- Rotate JWT, Firebase, and Google Maps credentials on a schedule.
- Enable centralized logs and alerting for authentication failures, SOS lifecycle events, and API 5xx spikes.
- Use least-privilege service accounts for Firebase and deployment automation.
- Configure mobile signing keys outside the repository.
