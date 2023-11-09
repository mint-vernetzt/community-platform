/*
  Warnings:

  - You are about to drop the column `bluesky` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "bluesky",
ADD COLUMN     "tiktok" TEXT;
