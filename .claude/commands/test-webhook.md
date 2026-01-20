# Test LoRaWAN Webhook Integration

Test the webhook integration between CRM Careflow and LoRaWAN Manager.

## Instructions

1. Check if services are running:
   ```bash
   curl -s http://localhost:3004/health
   curl -s http://localhost:3002/health
   ```

2. Login to get auth token:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3004/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@southerneleven.com","password":"password123"}' | jq -r '.access_token')
   echo "Token: ${TOKEN:0:20}..."
   ```

3. Send a test webhook directly to LoRaWAN Manager:
   ```bash
   curl -X POST http://localhost:3002/webhooks/crm-careflow/provision \
     -H "Content-Type: application/json" \
     -H "x-api-key: lorawan-webhook-key" \
     -d '{
       "eventType": "task.ready_for_provisioning",
       "taskId": "test-'$(date +%s)'",
       "clientName": "Test Client",
       "clientAddress": "123 Test St",
       "productName": "Test Product",
       "productCode": "TEST-001",
       "region": "EU868",
       "devices": [{
         "id": "dev-1",
         "deviceSerial": "TEST-DEVICE-001",
         "deviceType": "LoRa Sensor",
         "firmwareVersion": "v1.0.0"
       }]
     }'
   ```

4. Check LoRaWAN Manager logs for webhook receipt:
   ```bash
   docker compose -f /Users/robotics/Documents/claude-projects/lorawan-manager/docker-compose.yaml logs --tail=20 backend | grep -i webhook
   ```

Report success or failure with relevant log output.
