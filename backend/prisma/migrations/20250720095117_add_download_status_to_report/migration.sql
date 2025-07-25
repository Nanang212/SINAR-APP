-- AlterTable
ALTER TABLE "DocumentReport" ADD COLUMN     "downloaded_at" TIMESTAMP(3),
ADD COLUMN     "is_downloaded" BOOLEAN NOT NULL DEFAULT false;
