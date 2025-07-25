/*
  Warnings:

  - Added the required column `original_name` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "original_name" TEXT NOT NULL;
