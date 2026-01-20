# View Logs

View logs from CRM Careflow services.

## Arguments
- $ARGUMENTS: Service name (backend, frontend, postgres) or "all"

## Instructions

1. Parse the service argument:
   - If empty or "all", show all logs
   - If "backend", show backend logs
   - If "frontend", show frontend logs
   - If "postgres", show postgres logs

2. Show logs with appropriate command:
   ```bash
   cd $PROJECT_ROOT

   # For specific service
   docker compose -f docker-compose.prod.yaml logs --tail=100 -f $SERVICE

   # For all services
   docker compose -f docker-compose.prod.yaml logs --tail=50
   ```

3. If services aren't running in Docker, check for local processes:
   ```bash
   ps aux | grep -E "nest|next|postgres" | grep -v grep
   ```

Report which services are running and show recent log output.
