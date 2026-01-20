# Create Test Task

Create a new onboarding task and optionally progress it through the workflow.

## Arguments
- $ARGUMENTS: "full" to complete entire workflow, or empty for just creation

## Instructions

1. Login and get token:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3004/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@southerneleven.com","password":"password123"}' | jq -r '.access_token')
   ```

2. Get first available client and product:
   ```bash
   CLIENT_ID=$(curl -s http://localhost:3004/clients -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
   PRODUCT_ID=$(curl -s http://localhost:3004/products -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
   ```

3. Create task:
   ```bash
   TASK=$(curl -s -X POST http://localhost:3004/onboarding-tasks \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"clientId\":\"$CLIENT_ID\",\"productId\":\"$PRODUCT_ID\"}")
   TASK_ID=$(echo $TASK | jq -r '.id')
   echo "Created task: $TASK_ID"
   ```

4. If "full" argument provided, progress through all states:
   - SCHEDULED_VISIT: `{"scheduledDate":"2026-02-01T10:00:00Z"}`
   - REQUIREMENTS_COMPLETE: `{}`
   - HARDWARE_PROCUREMENT_COMPLETE: `{"hardwareList":[{"hardwareId":"...","quantity":1}]}`
   - HARDWARE_PREPARED_COMPLETE: `{"deviceList":[{"hardwareId":"...","deviceSerial":"TEST-001","firmwareVersion":"v1.0"}]}`
   - READY_FOR_INSTALLATION: `{}`

5. Show final task status:
   ```bash
   curl -s http://localhost:3004/onboarding-tasks/$TASK_ID -H "Authorization: Bearer $TOKEN" | jq '{id,status,lorawanProvisioningStatus:.deviceProvisionings[0].lorawanProvisioningStatus}'
   ```

Report the task ID and final status.
