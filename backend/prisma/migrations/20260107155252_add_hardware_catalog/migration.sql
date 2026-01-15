-- AlterTable
ALTER TABLE "device_provisionings" ADD COLUMN     "hardwareId" TEXT;

-- CreateTable
CREATE TABLE "hardware" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_hardware_configs" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "firmwareVersion" TEXT NOT NULL,
    "firmwareUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_hardware_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hardware_code_key" ON "hardware"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_hardware_configs_productId_hardwareId_key" ON "product_hardware_configs"("productId", "hardwareId");

-- AddForeignKey
ALTER TABLE "product_hardware_configs" ADD CONSTRAINT "product_hardware_configs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_hardware_configs" ADD CONSTRAINT "product_hardware_configs_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "hardware"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_provisionings" ADD CONSTRAINT "device_provisionings_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "hardware"("id") ON DELETE SET NULL ON UPDATE CASCADE;
