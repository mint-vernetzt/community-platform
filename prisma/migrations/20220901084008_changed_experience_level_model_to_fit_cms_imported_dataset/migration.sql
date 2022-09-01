/*
  Warnings:

  - A unique constraint covering the columns `[referenceId]` on the table `experience_levels` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `experience_levels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceId` to the `experience_levels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `experience_levels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "experience_levels" ADD COLUMN     "referenceId" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "experience_levels_referenceId_key" ON "experience_levels"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "experience_levels_slug_key" ON "experience_levels"("slug");
