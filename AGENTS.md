# Repository Guidelines

## Project Layout

- `backend/`: NestJS + Prisma API (Postgres)
- `frontend/`: Next.js app (UI)
- `docker-compose.yaml`: Postgres for local/dev
- `docker/`: local dev artifacts (Postgres volume, init SQL)
- `docs/`: architecture + diagrams
- `scripts/`: smoke tests + helper scripts

## Common Commands

Postgres:
- `docker compose up -d postgres`
- `docker compose logs -f postgres`

Backend (from `backend/`):
- `npm install`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npm run start:dev`

Frontend (from `frontend/`):
- `pnpm install`
- `pnpm dev`

## Safety Notes

- Do not commit `.env*` files or `docker/postgres/data/`.
- Prefer small, reversible changes.

