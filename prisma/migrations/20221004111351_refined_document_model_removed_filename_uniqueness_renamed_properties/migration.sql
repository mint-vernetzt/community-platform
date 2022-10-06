/*
  Warnings:

  - You are about to drop the column `file_name` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `documents` table. All the data in the column will be lost.
  - Added the required column `filename` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_in_mb` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "documents_file_name_key";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "file_name",
DROP COLUMN "size",
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "size_in_mb" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
