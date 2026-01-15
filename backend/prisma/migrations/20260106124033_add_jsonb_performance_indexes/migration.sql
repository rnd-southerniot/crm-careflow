-- Add GIN indexes for JSONB columns to improve query performance
-- These indexes are essential for efficient querying of JSONB data

-- Index for Role permissions JSONB column
-- Enables efficient permission checking queries
CREATE INDEX IF NOT EXISTS "roles_permissions_gin_idx" ON "roles" USING GIN ("permissions");

-- Index for SOPTemplate steps JSONB column
-- Enables efficient searching within SOP steps
CREATE INDEX IF NOT EXISTS "sop_templates_steps_gin_idx" ON "sop_templates" USING GIN ("steps");

-- Index for ReportSchema formStructure JSONB column
-- Enables efficient form field queries and validation
CREATE INDEX IF NOT EXISTS "report_schemas_form_structure_gin_idx" ON "report_schemas" USING GIN ("formStructure");

-- Index for OnboardingTask sopSnapshot JSONB column
-- Enables efficient searching within snapshotted SOP steps
CREATE INDEX IF NOT EXISTS "onboarding_tasks_sop_snapshot_gin_idx" ON "onboarding_tasks" USING GIN ("sopSnapshot");

-- Index for TechnicalReport submissionData JSONB column
-- Enables efficient searching within submitted form data
CREATE INDEX IF NOT EXISTS "technical_reports_submission_data_gin_idx" ON "technical_reports" USING GIN ("submissionData");

-- Additional specialized indexes for common query patterns

-- Index for searching SOP steps by specific properties (title, description, requiredRole)
CREATE INDEX IF NOT EXISTS "sop_templates_steps_properties_idx" ON "sop_templates" USING GIN ((steps #> '{}'));

-- Index for searching form fields by name and type
CREATE INDEX IF NOT EXISTS "report_schemas_field_properties_idx" ON "report_schemas" USING GIN (("formStructure" #> '{}'));

-- Index for searching technical report data by common field patterns
CREATE INDEX IF NOT EXISTS "technical_reports_data_properties_idx" ON "technical_reports" USING GIN (("submissionData" #> '{}'));

-- Composite indexes for common query patterns combining JSONB with regular columns

-- Index for onboarding tasks by status and product (frequently queried together)
CREATE INDEX IF NOT EXISTS "onboarding_tasks_status_product_idx" ON "onboarding_tasks" ("currentStatus", "productId");

-- Index for technical reports by task and submission date (for chronological queries)
CREATE INDEX IF NOT EXISTS "technical_reports_task_submitted_idx" ON "technical_reports" ("taskId", "submittedAt");

-- Index for device provisionings by task and provisioning date
CREATE INDEX IF NOT EXISTS "device_provisionings_task_provisioned_idx" ON "device_provisionings" ("taskId", "provisionedAt");

-- Index for users by role (for role-based queries)
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("roleId");