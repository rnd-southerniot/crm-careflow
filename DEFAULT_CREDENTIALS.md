# Default Login Credentials

## Issue Resolution

The login issue was caused by **an unseeded database**. The database has now been seeded with default users.

## Default User Accounts

The following test user accounts are available for login:

### 1. **Admin Account**
- **Email:** `admin@southerneleven.com`
- **Password:** `password123`
- **Role:** ADMIN
- **Permissions:** Full access to all modules (users, products, onboarding, reports, hardware)

### 2. **Sales Account**
- **Email:** `sales@southerneleven.com`
- **Password:** `password123`
- **Role:** SALES
- **Permissions:** 
  - Products: read
  - Onboarding: create, read, update
  - Reports: read

### 3. **Implementation Lead Account**
- **Email:** `impl@southerneleven.com`
- **Password:** `password123`
- **Role:** IMPLEMENTATION_LEAD
- **Permissions:**
  - Products: read
  - Onboarding: read, update
  - Reports: create, read, update

### 4. **Hardware Engineer Account**
- **Email:** `hardware@southerneleven.com`
- **Password:** `password123`
- **Role:** HARDWARE_ENGINEER
- **Permissions:**
  - Products: read
  - Onboarding: read, update
  - Hardware: create, read, update

## How to Re-seed the Database

If you need to reset the database or re-seed it with default data, run:

```bash
cd backend
pnpm run prisma:seed
```

## Sample Data Created

The seed script also creates:
- **Products:** Solar Gateway, Indoor Sensor, and product variations
- **SOP Templates:** Installation procedures for each product
- **Report Schemas:** Form structures for technical reports
- **Sample Tasks:** Onboarding tasks in various workflow states
- **Sample Reports & Provisionings:** Test data for development

## Database Connection

The application connects to PostgreSQL with the following configuration (from `.env`):

```
DATABASE_URL="postgresql://crm_admin:crm_admin_password@localhost:5432/crm_workflow?schema=public"
```

## Backend API

- **URL:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api (Swagger UI)

## Frontend Application

- **URL:** http://localhost:3000
- **Login Page:** http://localhost:3000/login

---

**Note:** These are development credentials. Make sure to change them in production!
