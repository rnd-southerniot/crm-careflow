/*
  Warnings:

  - Added the required column `deviceType` to the `device_provisionings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firmwareVersion` to the `device_provisionings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "device_provisionings" ADD COLUMN     "deviceType" TEXT NOT NULL,
ADD COLUMN     "firmwareVersion" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT;
