-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TEXT', 'LINK', 'AUDIO', 'VIDEO');

-- CreateTable
CREATE TABLE "DocumentReport" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "ReportType" NOT NULL,
    "content" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "DocumentReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentReport" ADD CONSTRAINT "DocumentReport_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReport" ADD CONSTRAINT "DocumentReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
