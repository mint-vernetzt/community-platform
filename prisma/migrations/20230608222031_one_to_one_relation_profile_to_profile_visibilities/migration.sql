/*
  Warnings:

  - You are about to drop the column `profile_id` on the `profile_visibilities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profileId]` on the table `profile_visibilities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `profile_visibilities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profile_visibilities" DROP COLUMN "profile_id",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profile_visibilities_profileId_key" ON "profile_visibilities"("profileId");

-- AddForeignKey
ALTER TABLE "profile_visibilities" ADD CONSTRAINT "profile_visibilities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
