/*
  Warnings:

  - You are about to drop the column `clientId` on the `onboarding_tasks` table. All the data in the column will be lost.
  - Added the required column `clientAddress` to the `onboarding_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientEmail` to the `onboarding_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientName` to the `onboarding_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientPhone` to the `onboarding_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPerson` to the `onboarding_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "onboarding_tasks" DROP COLUMN "clientId",
ADD COLUMN     "clientAddress" TEXT NOT NULL,
ADD COLUMN     "clientEmail" TEXT NOT NULL,
ADD COLUMN     "clientName" TEXT NOT NULL,
ADD COLUMN     "clientPhone" TEXT NOT NULL,
ADD COLUMN     "contactPerson" TEXT NOT NULL;
