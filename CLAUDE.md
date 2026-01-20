# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SCOMM CRM Tool - A CRM and workflow automation system for managing client onboarding with IoT hardware provisioning. Monorepo with NestJS backend and Next.js frontend. Integrates with LoRaWAN Manager for ChirpStack device provisioning.

## Quick Start

```bash
# Full stack with Docker (recommended for Ubuntu VM)
./scripts/deploy-local.sh

# Or manually:
docker compose up -d              # Start all services
docker compose logs -f backend    # Watch backend logs
```

## Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3004 | NestJS REST API |
| Frontend | 3005 | Next.js App |
| PostgreSQL | 5432 | Database |
| LoRaWAN Manager Backend | 3002 | Webhook target |
| LoRaWAN Manager Frontend | 3001 | IoT dashboard |

## Common Commands

### Local Development Setup

```bash
# Start Postgres
docker compose up -d postgres

# Backend (from backend/)
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed          # Seeds test users and sample data
npm run start:dev            # Runs on http://localhost:3004

# Frontend (from frontend/)
pnpm install
pnpm dev                     # Runs on http://localhost:3005
```

### Testing

```bash
# Backend (from backend/)
npm test                     # Unit tests
npm run test:watch           # Watch mode
npm run test:cov             # Coverage report
npm run test:e2e             # E2E tests

# Smoke test (services must be running)
API_BASE_URL=http://localhost:3004 ./scripts/smoke-test.sh

# Full integration test with LoRaWAN Manager
./scripts/test-lorawan-webhook.sh
```

### Linting & Formatting

```bash
# Backend (from backend/)
npm run lint                 # ESLint with autofix
npm run format               # Prettier

# Frontend (from frontend/)
pnpm lint
```

### Database Operations

```bash
# From backend/
npx prisma migrate dev       # Create/apply migrations
npx prisma migrate deploy    # Apply migrations (production)
npx prisma studio            # Visual database browser
npx prisma generate          # Regenerate client after schema changes
```

### Production Deployment

```bash
# Local/VM deployment
./scripts/deploy-local.sh

# Or with docker compose directly
docker compose -f docker-compose.prod.yaml up -d --build
docker compose -f docker-compose.prod.yaml logs -f
```

## Architecture

### Tech Stack

- **Backend**: NestJS 10, Prisma ORM, PostgreSQL 16, Passport JWT auth
- **Frontend**: Next.js 15 (App Router), Zustand, TanStack Query, Radix UI, Tailwind CSS 4
- **Package Managers**: npm (backend), pnpm (frontend)
- **Integrations**: LoRaWAN Manager (ChirpStack provisioning)

### Key Architectural Patterns

**Onboarding Task State Machine**: Core workflow with 6 states defining valid transitions:
```
INITIALIZATION → SCHEDULED_VISIT → REQUIREMENTS_COMPLETE →
HARDWARE_PROCUREMENT_COMPLETE → HARDWARE_PREPARED_COMPLETE → READY_FOR_INSTALLATION
```
State transitions are enforced in `backend/src/workflow/status-transition.service.ts`.

**LoRaWAN Integration**: When tasks reach `READY_FOR_INSTALLATION`, a webhook is automatically sent to LoRaWAN Manager to provision devices in ChirpStack.

**Dynamic Forms**: Form structure stored in database (`ReportSchema.formStructure` as JSONB), rendered by `frontend/components/forms/DynamicFormRenderer.tsx`.

**RBAC**: Role-based permissions stored as JSON in the `Role` table. Permission structure: `{ module: string, actions: ['create'|'read'|'update'|'delete'] }`. Modules: users, products, onboarding, reports, hardware.

**Hardware Configuration**: Products link to compatible hardware via `ProductHardwareConfig`, which tracks firmware versions and default hardware assignments.

### Backend Structure (backend/src/)

- `auth/` - JWT + Passport local strategy, guards, decorators (`@CurrentUser`)
- `workflow/` - OnboardingTask state machine and transition logic
- `products/` - Products, SOPTemplate, ReportSchema management
- `hardware/` - Hardware catalog, categories, device provisioning with QR codes
- `reports/` - TechnicalReport dynamic form handling
- `clients/` - Client/organization management
- `integrations/lorawan/` - LoRaWAN Manager webhook integration
- `common/` - Global exception filters, interceptors
- `prisma/` - Prisma service wrapper

### Frontend Structure (frontend/)

- `app/` - Next.js App Router pages (admin, clients, dashboard, hardware, implementation, sales, tasks)
- `components/` - Organized by domain (forms, dashboard, layouts, ui, auth, products)
- `services/api.ts` - Axios client with JWT interceptors and typed API methods
- `lib/zustand-store/` - Auth state and permissions management

### Data Model

Primary entities in `backend/prisma/schema.prisma`:
- **OnboardingTask**: Main workflow entity with TaskStatus enum, location coords
- **Product**: Products with LoRaWAN support (`isLorawanProduct`, `lorawanRegion`)
- **Hardware/HardwareCategory**: Component catalog
- **ProductHardwareConfig**: Links products to compatible hardware with firmware
- **TechnicalReport**: Dynamic form submissions (JSONB data)
- **DeviceProvisioning**: Provisioned devices with QR codes, LoRaWAN keys (devEui, appKey)
- **WebhookLog**: Tracks webhook delivery to LoRaWAN Manager

## API

- Swagger UI: `http://localhost:3004/api`
- Health check: `http://localhost:3004/health`
- Auth: Bearer token in Authorization header

## Test Credentials

After running `npm run prisma:seed`:
- Admin: `admin@southerneleven.com` / `password123`
- Sales: `sales@southerneleven.com` / `password123`
- Implementation: `impl@southerneleven.com` / `password123`
- Hardware: `hardware@southerneleven.com` / `password123`

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://crm_admin:crm_admin_password@localhost:5432/crm_workflow?schema=public"

# Server
PORT=3004
HOST=0.0.0.0
NODE_ENV=development

# Auth
JWT_SECRET="your-secret-here"
JWT_EXPIRES_IN="24h"

# CORS
CORS_ORIGINS="http://localhost:3005,http://localhost:3000"

# LoRaWAN Manager Integration
LORAWAN_MANAGER_URL="http://localhost:3002"
LORAWAN_MANAGER_API_KEY="lorawan-webhook-key"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3004
```

## LoRaWAN Manager Integration

This CRM integrates with LoRaWAN Manager for IoT device provisioning in ChirpStack.

### Integration Flow (Tested & Working)

```
CRM (READY_FOR_INSTALLATION) → Webhook → LoRaWAN Manager → gRPC → ChirpStack
```

When a task reaches `READY_FOR_INSTALLATION`:
1. CRM sends webhook to LoRaWAN Manager
2. LoRaWAN Manager creates ChirpStack Tenant (from client name)
3. Creates Device Profile for the region (EU868, US915, etc.)
4. Creates Application (from product name)
5. Creates Devices with OTAA keys
6. Updates DeviceProvisioning status in CRM

### Webhook Endpoint

```
POST http://localhost:3002/webhooks/crm-careflow/provision
Header: x-api-key: lorawan-webhook-key
```

### Payload Structure

```typescript
{
  eventType: "task.ready_for_provisioning",
  taskId: string,
  clientName: string,       // → ChirpStack Tenant
  clientAddress: string,
  productName: string,      // → ChirpStack Application
  productCode: string,
  region?: string,          // EU868, US915, AU915, AS923, KR920, IN865
  devices?: [{
    id: string,
    deviceSerial: string,
    deviceType: string,
    firmwareVersion: string,
    devEui?: string,        // 16-char hex (auto-generated if empty)
    appKey?: string,        // 32-char hex (auto-generated if empty)
  }],
  gateway?: { /* same structure */ },
  latitude?: number,
  longitude?: number
}
```

### LoRaWAN Product Setup

1. Create product with `isLorawanProduct: true` and `lorawanRegion: EU868`
2. Add SOP Template and Report Schema
3. Configure hardware with device profiles
4. When task completes, devices are auto-provisioned to ChirpStack

### Related Repositories

- **LoRaWAN Manager**: `/Users/robotics/Documents/claude-projects/lorawan-manager`
- **ChirpStack Server**: `scomm.southerneleven.com`
