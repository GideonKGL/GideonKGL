# AGENTS.md

## Cursor Cloud specific instructions

Guardian Tracker is an npm-workspaces monorepo. The runnable dev services are `backend`
(Express + Prisma + PostgreSQL + Socket.IO API on port 4000), `web` (React/Vite portal on
port 5173), and `desktop` (Electron monitoring console; Vite renderer on port 5174). The
`mobile` workspace is a Flutter Android app and is not set up here (no Flutter SDK; needs an
Android emulator). Standard commands live in the root `README.md` and each workspace
`package.json`; the notes below only cover non-obvious cloud setup.

### Environment file
- The backend reads configuration from the repo-root `.env` (NOT `backend/.env`). It is
  gitignored and created during setup from `.env.example`. If it is missing, recreate it:
  `cp .env.example .env` then set `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` to any 32+ char
  strings and keep `DATABASE_URL=postgresql://guardian:guardian_password@localhost:5432/guardian_tracker?schema=public`.
- The backend code does NOT auto-load `.env`. Before running any backend / Prisma command,
  load it into the shell: `set -a; . /workspace/.env; set +a`. (Docker Compose injects it via
  `env_file`, but local dev does not.)
- The Vite apps fall back to `http://localhost:4000/api/v1` when `VITE_*` vars are unset, so
  the web/desktop renderers work against a local backend without extra config.

### PostgreSQL
- Postgres 16 is installed via apt (not Docker; Docker is not available). It is not started
  automatically — start it each session with: `sudo pg_ctlcluster 16 main start`.
- A superuser role `guardian` (password `guardian_password`) and database `guardian_tracker`
  back the dev `DATABASE_URL`. If they are missing, recreate the role/db and grant it; the
  init migration needs the `pgcrypto` extension, so the role needs superuser (or pre-create
  the extension).
- After the DB is up, apply schema + seed from `backend/` with env loaded:
  `npm run migrate` then `npm run seed`. Seed is idempotent (upserts) and creates the admin
  login `admin@securitatemdefensionis.co.za` / `ChangeThisPassword123!`.

### Running the services (load `.env` first in each shell)
- Backend: `cd backend && npm run dev` (tsx watch; serves `/api/v1`, has `/api/v1/health`).
- Web: `cd web && npm run dev`.
- Desktop: `cd desktop && DISPLAY=:1 ELECTRON_DISABLE_SANDBOX=1 npm run dev`. Electron needs
  a display and the sandbox disabled in this container; the dbus/GPU/WebGL warnings it logs
  are harmless. It also opens a detached DevTools window over the app.

### Build / lint / test
- Typecheck/build: `npm run build` at the root (or per workspace). Web build emits a large
  single chunk warning — non-fatal.
- The `backend` `lint` script (`eslint src --ext .ts`) is currently not runnable because
  `eslint` is not declared as a dependency. There is no automated test suite in the repo.
