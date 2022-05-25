/*
  Warnings:

  - You are about to drop the column `offerings` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `seekings` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "offerings",
DROP COLUMN "seekings";
