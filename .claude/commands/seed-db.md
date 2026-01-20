# Seed Database

Reset and seed the database with test data.

## Instructions

1. If running in Docker:
   ```bash
   cd $PROJECT_ROOT && docker compose exec backend npx prisma migrate reset --force
   ```

2. If running locally with npm:
   ```bash
   cd $PROJECT_ROOT/backend && npx prisma migrate reset --force
   ```

3. Verify seed data:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3004/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@southerneleven.com","password":"password123"}' | jq -r '.access_token')

   echo "Users:"
   curl -s http://localhost:3004/users -H "Authorization: Bearer $TOKEN" | jq '.length'

   echo "Products:"
   curl -s http://localhost:3004/products -H "Authorization: Bearer $TOKEN" | jq '.length'

   echo "Hardware:"
   curl -s http://localhost:3004/hardware -H "Authorization: Bearer $TOKEN" | jq '.length'
   ```

Report the counts of seeded entities.
