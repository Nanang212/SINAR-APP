-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "updatedBy" TEXT NOT NULL DEFAULT 'system';
