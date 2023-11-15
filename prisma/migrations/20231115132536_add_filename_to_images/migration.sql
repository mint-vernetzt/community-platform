/*
  Warnings:

  - Added the required column `filename` to the `image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "image" ADD COLUMN     "filename" TEXT NOT NULL;
