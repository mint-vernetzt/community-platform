/*
  Warnings:

  - You are about to drop the column `title` on the `target_groups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `target_groups` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `target_groups` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "target_groups_title_key";

-- AlterTable
ALTER TABLE "target_groups" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "target_groups_name_key" ON "target_groups"("name");
