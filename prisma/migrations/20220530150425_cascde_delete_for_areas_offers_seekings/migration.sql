/*
  Warnings:

  - You are about to drop the column `offerings` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `seekings` on the `profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "areas_on_profiles" DROP CONSTRAINT "areas_on_profiles_profileId_fkey";

-- DropForeignKey
ALTER TABLE "offers_on_profiles" DROP CONSTRAINT "offers_on_profiles_profileId_fkey";

-- DropForeignKey
ALTER TABLE "seekings_on_profiles" DROP CONSTRAINT "seekings_on_profiles_profileId_fkey";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "offerings",
DROP COLUMN "seekings";

-- AddForeignKey
ALTER TABLE "areas_on_profiles" ADD CONSTRAINT "areas_on_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seekings_on_profiles" ADD CONSTRAINT "seekings_on_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_on_profiles" ADD CONSTRAINT "offers_on_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
