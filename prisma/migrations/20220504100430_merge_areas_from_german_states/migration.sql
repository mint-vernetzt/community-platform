/*
  Warnings:

  - The primary key for the `areas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `areas_on_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `type` to the `District` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "district_types" AS ENUM ('land', 'urban');

-- DropForeignKey
ALTER TABLE "areas_on_profiles" DROP CONSTRAINT "areas_on_profiles_areaId_fkey";

-- AlterTable
ALTER TABLE "District" ADD COLUMN     "type" "district_types" NOT NULL;

-- AlterTable
ALTER TABLE "areas" DROP CONSTRAINT "areas_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "areas_id_seq";

-- AlterTable
ALTER TABLE "areas_on_profiles" DROP CONSTRAINT "areas_on_profiles_pkey",
ALTER COLUMN "areaId" SET DATA TYPE TEXT,
ADD CONSTRAINT "areas_on_profiles_pkey" PRIMARY KEY ("profileId", "areaId");

-- AddForeignKey
ALTER TABLE "areas_on_profiles" ADD CONSTRAINT "areas_on_profiles_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
