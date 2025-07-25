/*
  Warnings:

  - You are about to drop the column `type` on the `DocumentReport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocumentReport" DROP COLUMN "type";

-- DropEnum
DROP TYPE "ReportType";
