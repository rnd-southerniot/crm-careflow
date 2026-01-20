# Deploy CRM Careflow

Deploy the full CRM Careflow stack locally using Docker.

## Instructions

1. Stop any existing containers:
   ```bash
   cd $PROJECT_ROOT && docker compose down
   ```

2. Build and start all services:
   ```bash
   cd $PROJECT_ROOT && docker compose -f docker-compose.prod.yaml up -d --build
   ```

3. Wait for services to be healthy and run migrations:
   ```bash
   cd $PROJECT_ROOT && docker compose -f docker-compose.prod.yaml exec backend npx prisma migrate deploy
   ```

4. Verify deployment:
   ```bash
   curl -s http://localhost:3004/health && echo " Backend OK"
   curl -s http://localhost:3005 > /dev/null && echo "Frontend OK"
   ```

5. Show running containers:
   ```bash
   docker compose -f docker-compose.prod.yaml ps
   ```

Report the URLs:
- Backend API: http://localhost:3004
- Frontend: http://localhost:3005
- Swagger: http://localhost:3004/api
