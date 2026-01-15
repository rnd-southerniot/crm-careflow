/*
  Warnings:

  - The values [REQ_GATHERING_COMPLETE] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('INITIALIZATION', 'SCHEDULED_VISIT', 'REQUIREMENTS_COMPLETE', 'HARDWARE_PROCUREMENT_COMPLETE', 'HARDWARE_PREPARED_COMPLETE', 'READY_FOR_INSTALLATION');
ALTER TABLE "onboarding_tasks" ALTER COLUMN "currentStatus" TYPE "TaskStatus_new" USING ("currentStatus"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "onboarding_tasks" ADD COLUMN     "scheduledDate" TIMESTAMP(3);
