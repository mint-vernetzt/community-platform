/*
  Warnings:

  - Added the required column `test` to the `offers_on_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "offers_on_profiles" ADD COLUMN     "test" TEXT NOT NULL;
