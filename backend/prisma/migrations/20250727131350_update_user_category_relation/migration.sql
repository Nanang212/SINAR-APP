/*
  Warnings:

  - You are about to drop the column `category_id` on the `Document` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_category_id_fkey";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "category_id";

-- CreateTable
CREATE TABLE "_DocumentKategori" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DocumentKategori_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DocumentKategori_B_index" ON "_DocumentKategori"("B");

-- AddForeignKey
ALTER TABLE "_DocumentKategori" ADD CONSTRAINT "_DocumentKategori_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentKategori" ADD CONSTRAINT "_DocumentKategori_B_fkey" FOREIGN KEY ("B") REFERENCES "Kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
