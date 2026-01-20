#!/usr/bin/env bash
#
# Deploy CRM Careflow locally or on Ubuntu VM
# Usage: ./scripts/deploy-local.sh [--reset]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# Check dependencies
check_deps() {
    log "Checking dependencies..."
    command -v docker >/dev/null 2>&1 || error "Docker not found. Install: https://docs.docker.com/engine/install/ubuntu/"
    command -v docker compose >/dev/null 2>&1 || error "Docker Compose not found"
    log "Dependencies OK"
}

# Create .env files if they don't exist
setup_env() {
    log "Setting up environment files..."

    # Backend .env
    if [[ ! -f "$PROJECT_ROOT/backend/.env" ]]; then
        cat > "$PROJECT_ROOT/backend/.env" << 'EOF'
# Database
DATABASE_URL="postgresql://crm_admin:crm_admin_password@localhost:5432/crm_workflow?schema=public"

# Server
PORT=3004
HOST=0.0.0.0
NODE_ENV=production

# Auth
JWT_SECRET="change-this-in-production-$(openssl rand -hex 16)"
JWT_EXPIRES_IN="24h"

# CORS
CORS_ORIGINS="http://localhost:3005,http://localhost:3000"

# LoRaWAN Manager Integration
LORAWAN_MANAGER_URL="http://localhost:3002"
LORAWAN_MANAGER_API_KEY="lorawan-webhook-key"
EOF
        log "Created backend/.env"
    else
        warn "backend/.env already exists, skipping"
    fi

    # Frontend .env.local
    if [[ ! -f "$PROJECT_ROOT/frontend/.env.local" ]]; then
        cat > "$PROJECT_ROOT/frontend/.env.local" << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3004
EOF
        log "Created frontend/.env.local"
    else
        warn "frontend/.env.local already exists, skipping"
    fi
}

# Stop existing containers
stop_services() {
    log "Stopping existing services..."
    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.prod.yaml down 2>/dev/null || true
    docker compose down 2>/dev/null || true
}

# Reset database if requested
reset_db() {
    if [[ "${1:-}" == "--reset" ]]; then
        warn "Resetting database..."
        docker volume rm crm-careflow_postgres_data 2>/dev/null || true
    fi
}

# Build and start services
start_services() {
    log "Building and starting services..."
    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.prod.yaml up -d --build

    log "Waiting for services to be healthy..."
    sleep 10

    # Wait for postgres
    for i in {1..30}; do
        if docker compose -f docker-compose.prod.yaml exec -T postgres pg_isready -U crm_admin -d crm_workflow >/dev/null 2>&1; then
            log "PostgreSQL is ready"
            break
        fi
        sleep 2
    done

    # Run migrations
    log "Running database migrations..."
    docker compose -f docker-compose.prod.yaml exec -T backend npx prisma migrate deploy || true

    # Seed if database is empty
    log "Checking if seed is needed..."
    docker compose -f docker-compose.prod.yaml exec -T backend npx prisma db seed || warn "Seed skipped (may already exist)"
}

# Verify deployment
verify() {
    log "Verifying deployment..."

    # Check backend
    for i in {1..10}; do
        if curl -sf http://localhost:3004/health >/dev/null 2>&1; then
            log "Backend is healthy"
            break
        fi
        sleep 2
    done

    # Check frontend
    for i in {1..10}; do
        if curl -sf http://localhost:3005 >/dev/null 2>&1; then
            log "Frontend is healthy"
            break
        fi
        sleep 2
    done

    echo ""
    log "=== Deployment Complete ==="
    echo ""
    echo "  Backend API:  http://localhost:3004"
    echo "  Swagger UI:   http://localhost:3004/api"
    echo "  Frontend:     http://localhost:3005"
    echo ""
    echo "  Test credentials:"
    echo "    admin@southerneleven.com / password123"
    echo ""
    echo "  View logs:    docker compose -f docker-compose.prod.yaml logs -f"
    echo "  Stop:         docker compose -f docker-compose.prod.yaml down"
    echo ""
}

# Main
main() {
    echo ""
    echo "=================================="
    echo "  CRM Careflow Local Deployment"
    echo "=================================="
    echo ""

    check_deps
    setup_env
    reset_db "${1:-}"
    stop_services
    start_services
    verify
}

main "$@"
