/*
  Warnings:

  - Added the required column `type` to the `DocumentReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DocumentReport" ADD COLUMN     "type" TEXT NOT NULL;
