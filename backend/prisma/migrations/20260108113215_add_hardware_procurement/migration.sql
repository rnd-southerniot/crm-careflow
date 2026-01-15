-- CreateTable
CREATE TABLE "hardware_procurements" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hardware_procurements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hardware_procurements" ADD CONSTRAINT "hardware_procurements_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "onboarding_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_procurements" ADD CONSTRAINT "hardware_procurements_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "hardware"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
