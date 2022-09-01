/*
  Warnings:

  - You are about to drop the column `name` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `target_groups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referenceId]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referenceId]` on the table `target_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `target_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `target_groups` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceId` to the `tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceId` to the `target_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `target_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `target_groups` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tags_name_key";

-- DropIndex
DROP INDEX "target_groups_name_key";

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "name",
DROP COLUMN "tagId",
ADD COLUMN     "referenceId" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "target_groups" DROP COLUMN "name",
ADD COLUMN     "referenceId" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tags_referenceId_key" ON "tags"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_title_key" ON "tags"("title");

-- CreateIndex
CREATE UNIQUE INDEX "target_groups_referenceId_key" ON "target_groups"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "target_groups_title_key" ON "target_groups"("title");

-- CreateIndex
CREATE UNIQUE INDEX "target_groups_slug_key" ON "target_groups"("slug");
