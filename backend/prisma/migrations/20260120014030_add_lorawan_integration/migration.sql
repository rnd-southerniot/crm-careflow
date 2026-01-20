-- CreateEnum
CREATE TYPE "LorawanProvisioningStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- AlterTable
ALTER TABLE "device_provisionings" ADD COLUMN     "appKey" TEXT,
ADD COLUMN     "devEui" TEXT,
ADD COLUMN     "lorawanProvisionedAt" TIMESTAMP(3),
ADD COLUMN     "lorawanProvisioningError" TEXT,
ADD COLUMN     "lorawanProvisioningStatus" "LorawanProvisioningStatus" NOT NULL DEFAULT 'NOT_APPLICABLE';

-- AlterTable
ALTER TABLE "onboarding_tasks" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isLorawanProduct" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lorawanRegion" TEXT;

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "webhookType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "statusCode" INTEGER,
    "response" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_logs_taskId_idx" ON "webhook_logs"("taskId");
