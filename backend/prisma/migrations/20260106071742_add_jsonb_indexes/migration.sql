-- Add GIN indexes for JSONB columns to improve query performance

-- Index for SOPTemplate steps JSONB column
CREATE INDEX IF NOT EXISTS "sop_templates_steps_gin_idx" ON "sop_templates" USING GIN ("steps");

-- Index for ReportSchema formStructure JSONB column (using camelCase as in DB)
CREATE INDEX IF NOT EXISTS "report_schemas_form_structure_gin_idx" ON "report_schemas" USING GIN ("formStructure");

-- Index for OnboardingTask sopSnapshot JSONB column (using camelCase as in DB)
CREATE INDEX IF NOT EXISTS "onboarding_tasks_sop_snapshot_gin_idx" ON "onboarding_tasks" USING GIN ("sopSnapshot");

-- Index for TechnicalReport submissionData JSONB column (using camelCase as in DB)
CREATE INDEX IF NOT EXISTS "technical_reports_submission_data_gin_idx" ON "technical_reports" USING GIN ("submissionData");

-- Index for Role permissions JSONB column
CREATE INDEX IF NOT EXISTS "roles_permissions_gin_idx" ON "roles" USING GIN ("permissions");

-- Additional indexes for common query patterns

-- Index for searching SOP steps by title or description
CREATE INDEX IF NOT EXISTS "sop_templates_steps_title_idx" ON "sop_templates" USING GIN ((steps -> 'title'));

-- Index for searching form fields by name
CREATE INDEX IF NOT EXISTS "report_schemas_field_names_idx" ON "report_schemas" USING GIN (("formStructure" -> 'name'));

-- Index for searching technical report data by specific fields (example with signalStrength)
CREATE INDEX IF NOT EXISTS "technical_reports_signal_strength_idx" ON "technical_reports" USING GIN (("submissionData" -> 'signalStrength'));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "onboarding_tasks_status_product_idx" ON "onboarding_tasks" ("currentStatus", "productId");
CREATE INDEX IF NOT EXISTS "technical_reports_task_submitted_idx" ON "technical_reports" ("taskId", "submittedAt");
CREATE INDEX IF NOT EXISTS "device_provisionings_task_provisioned_idx" ON "device_provisionings" ("taskId", "provisionedAt");