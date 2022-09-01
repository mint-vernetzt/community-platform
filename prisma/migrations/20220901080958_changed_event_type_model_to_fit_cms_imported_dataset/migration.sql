/*
  Warnings:

  - A unique constraint covering the columns `[referenceId]` on the table `event_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `event_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceId` to the `event_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `event_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_types" ADD COLUMN     "referenceId" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "event_types_referenceId_key" ON "event_types"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_slug_key" ON "event_types"("slug");
