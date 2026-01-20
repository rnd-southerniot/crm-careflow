#!/usr/bin/env bash
#
# Test LoRaWAN webhook integration
# Usage: ./scripts/test-lorawan-webhook.sh
#
set -euo pipefail

API_URL="${API_URL:-http://localhost:3004}"
LORAWAN_URL="${LORAWAN_URL:-http://localhost:3002}"
API_KEY="${API_KEY:-lorawan-webhook-key}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# Check services
log "Checking CRM Backend..."
curl -sf "$API_URL/health" >/dev/null || error "CRM Backend not reachable at $API_URL"
log "CRM Backend OK"

log "Checking LoRaWAN Manager..."
curl -sf "$LORAWAN_URL/health" >/dev/null || warn "LoRaWAN Manager not reachable at $LORAWAN_URL (may still work)"

# Send test webhook
log "Sending test webhook to LoRaWAN Manager..."

TASK_ID="test-$(date +%s)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$LORAWAN_URL/webhooks/crm-careflow/provision" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"eventType\": \"task.ready_for_provisioning\",
    \"taskId\": \"$TASK_ID\",
    \"clientName\": \"Test Client $(date +%H%M%S)\",
    \"clientAddress\": \"123 Test Street, Test City\",
    \"productName\": \"Test LoRaWAN Product\",
    \"productCode\": \"TEST-LORA-001\",
    \"region\": \"EU868\",
    \"devices\": [{
      \"id\": \"dev-$TASK_ID\",
      \"deviceSerial\": \"TEST-DEVICE-$(date +%s)\",
      \"deviceType\": \"LoRa Temperature Sensor\",
      \"firmwareVersion\": \"v1.0.0\",
      \"devEui\": \"$(openssl rand -hex 8 | tr '[:lower:]' '[:upper:]')\",
      \"appKey\": \"$(openssl rand -hex 16 | tr '[:lower:]' '[:upper:]')\"
    }],
    \"latitude\": 51.5074,
    \"longitude\": -0.1278
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    log "Webhook sent successfully (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    error "Webhook failed (HTTP $HTTP_CODE): $BODY"
fi

echo ""
log "=== Test Complete ==="
echo ""
echo "  Check LoRaWAN Manager logs:"
echo "  $ docker compose logs --tail=20 backend | grep -i webhook"
echo ""
