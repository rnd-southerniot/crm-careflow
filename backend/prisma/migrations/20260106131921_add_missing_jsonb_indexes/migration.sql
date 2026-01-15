-- Add the core JSONB GIN indexes that are essential for performance
-- These indexes enable efficient querying of JSONB columns

-- Index for Role permissions JSONB column
-- Critical for role-based access control queries
CREATE INDEX IF NOT EXISTS "roles_permissions_gin_idx" ON "roles" USING GIN ("permissions");

-- Index for SOPTemplate steps JSONB column  
-- Essential for searching within SOP step content
CREATE INDEX IF NOT EXISTS "sop_templates_steps_gin_idx" ON "sop_templates" USING GIN ("steps");

-- Index for ReportSchema formStructure JSONB column
-- Critical for dynamic form generation and validation
CREATE INDEX IF NOT EXISTS "report_schemas_form_structure_gin_idx" ON "report_schemas" USING GIN ("formStructure");

-- Index for OnboardingTask sopSnapshot JSONB column
-- Important for workflow step queries on historical snapshots
CREATE INDEX IF NOT EXISTS "onboarding_tasks_sop_snapshot_gin_idx" ON "onboarding_tasks" USING GIN ("sopSnapshot");

-- Index for TechnicalReport submissionData JSONB column
-- Essential for searching within submitted form data
CREATE INDEX IF NOT EXISTS "technical_reports_submission_data_gin_idx" ON "technical_reports" USING GIN ("submissionData");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "onboarding_tasks_status_product_idx" ON "onboarding_tasks" ("currentStatus", "productId");
CREATE INDEX IF NOT EXISTS "technical_reports_task_submitted_idx" ON "technical_reports" ("taskId", "submittedAt");
CREATE INDEX IF NOT EXISTS "device_provisionings_task_provisioned_idx" ON "device_provisionings" ("taskId", "provisionedAt");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("roleId");