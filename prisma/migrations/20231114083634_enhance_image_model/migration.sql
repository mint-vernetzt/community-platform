/*
  Warnings:

  - Added the required column `size_in_mb` to the `image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "image" ADD COLUMN     "name" TEXT,
ADD COLUMN     "size_in_mb" DOUBLE PRECISION NOT NULL;
