/*
  Warnings:

  - You are about to drop the `profile_areas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "profile_areas" DROP CONSTRAINT "profile_areas_areaId_fkey";

-- DropForeignKey
ALTER TABLE "profile_areas" DROP CONSTRAINT "profile_areas_profileId_fkey";

-- DropTable
DROP TABLE "profile_areas";

-- CreateTable
CREATE TABLE "areas_on_profiles" (
    "profileId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "areas_on_profiles_pkey" PRIMARY KEY ("profileId","areaId")
);

-- AddForeignKey
ALTER TABLE "areas_on_profiles" ADD CONSTRAINT "areas_on_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_profiles" ADD CONSTRAINT "areas_on_profiles_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
