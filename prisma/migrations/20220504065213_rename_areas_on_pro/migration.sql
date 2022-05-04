/*
  Warnings:

  - You are about to drop the `AreasOnProfiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AreasOnProfiles" DROP CONSTRAINT "AreasOnProfiles_areaId_fkey";

-- DropForeignKey
ALTER TABLE "AreasOnProfiles" DROP CONSTRAINT "AreasOnProfiles_profileId_fkey";

-- DropTable
DROP TABLE "AreasOnProfiles";

-- CreateTable
CREATE TABLE "profile_areas" (
    "profileId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "profile_areas_pkey" PRIMARY KEY ("profileId","areaId")
);

-- AddForeignKey
ALTER TABLE "profile_areas" ADD CONSTRAINT "profile_areas_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_areas" ADD CONSTRAINT "profile_areas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
