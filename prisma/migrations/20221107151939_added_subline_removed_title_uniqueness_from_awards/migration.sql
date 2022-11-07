/*
  Warnings:

  - Added the required column `subline` to the `awards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "awards_title_key";

-- AlterTable
ALTER TABLE "awards" ADD COLUMN     "subline" TEXT NOT NULL;
