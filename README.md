# SCOMM CRM Tool

CRM + workflow automation stack:
- **Backend**: NestJS + Prisma + Postgres
- **Frontend**: Next.js (App Router) + React Query + Zustand auth

## Quick Start (Local)

1) Start Postgres:

```bash
docker compose up -d postgres
```

2) Backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

3) Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`
- Health: `http://localhost:3001/health`

## Environment

Create environment files locally (do not commit secrets):

- `backend/.env` (see `backend/.env.example`)
- `frontend/.env.development` (see `frontend/.env.example`)

For VM deployments, prefer injecting env vars via your process manager (systemd/PM2) or container runtime.

### CORS / “communicate with other app”

Backend supports a comma-separated allowlist:

- `CORS_ORIGINS=http://localhost:3000,http://other-app.example`

## Architecture (Mermaid)

See `docs/architecture.mmd`.

## Docker Deployment (Ubuntu VM)

Use the production compose file to build and run Postgres, the Nest API, and the Next.js UI.

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```

Update these values in `docker-compose.prod.yaml` before deploying:

- Backend: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`
- Frontend: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DOMAIN`, `NEXT_PUBLIC_API_URL`, `HOST_NAME`

If you need logs:

```bash
docker compose -f docker-compose.prod.yaml logs -f
```

## Smoke Test

With services running:

```bash
./scripts/smoke-test.sh
```

## Moving out of the accidental `/Users/arif` git repo

This folder currently lives under a git repo rooted at `/Users/arif`. To avoid tracking your entire home directory,
move this project to a dedicated location and make it its own repo, e.g. on a VM: `/srv/scomm-crm-tool`.

Example move (run manually):

```bash
mkdir -p /Users/Shared/work
mv /Users/arif/Projects/scomm-crm-tool /Users/Shared/work/scomm-crm-tool
cd /Users/Shared/work/scomm-crm-tool
git init
```
