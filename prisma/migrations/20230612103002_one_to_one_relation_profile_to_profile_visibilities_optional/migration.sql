/*
  Warnings:

  - You are about to drop the column `profile_id` on the `profile_visibilities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profile_visibility_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "profile_visibilities" DROP COLUMN "profile_id";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "profile_visibility_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_profile_visibility_id_key" ON "profiles"("profile_visibility_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_visibility_id_fkey" FOREIGN KEY ("profile_visibility_id") REFERENCES "profile_visibilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
