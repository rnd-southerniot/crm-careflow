#!/usr/bin/env bash
#
# Install dependencies for CRM Careflow on Ubuntu 22.04/24.04
# Run as: sudo ./scripts/install-ubuntu.sh
#
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (sudo)"
fi

log "Installing dependencies for CRM Careflow..."

# Update system
log "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install basic tools
log "Installing basic tools..."
apt-get install -y \
    curl \
    wget \
    git \
    jq \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    SUDO_USER="${SUDO_USER:-$USER}"
    if [[ -n "$SUDO_USER" && "$SUDO_USER" != "root" ]]; then
        usermod -aG docker "$SUDO_USER"
        log "Added $SUDO_USER to docker group (re-login required)"
    fi

    # Start Docker
    systemctl enable docker
    systemctl start docker
    log "Docker installed successfully"
else
    log "Docker already installed"
fi

# Install Node.js (for local development without Docker)
if ! command -v node &> /dev/null; then
    log "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log "Node.js $(node --version) installed"
else
    log "Node.js already installed: $(node --version)"
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    log "Installing pnpm..."
    npm install -g pnpm
    log "pnpm installed"
else
    log "pnpm already installed"
fi

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null && ufw status | grep -q "active"; then
    log "Configuring firewall..."
    ufw allow 3004/tcp  # Backend
    ufw allow 3005/tcp  # Frontend
    ufw allow 5432/tcp  # PostgreSQL (optional, only if external access needed)
    log "Firewall rules added"
fi

# Create app directory
APP_DIR="/opt/crm-careflow"
if [[ ! -d "$APP_DIR" ]]; then
    log "Creating app directory at $APP_DIR..."
    mkdir -p "$APP_DIR"
    if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != "root" ]]; then
        chown -R "$SUDO_USER:$SUDO_USER" "$APP_DIR"
    fi
fi

echo ""
log "=== Installation Complete ==="
echo ""
echo "  Next steps:"
echo ""
echo "  1. Re-login for docker group to take effect:"
echo "     $ exit && ssh user@server"
echo ""
echo "  2. Clone the repository:"
echo "     $ cd /opt/crm-careflow"
echo "     $ git clone <repo-url> ."
echo ""
echo "  3. Deploy:"
echo "     $ ./scripts/deploy-local.sh"
echo ""
