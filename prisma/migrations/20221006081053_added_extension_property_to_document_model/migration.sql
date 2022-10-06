/*
  Warnings:

  - Added the required column `extension` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "extension" TEXT NOT NULL;
