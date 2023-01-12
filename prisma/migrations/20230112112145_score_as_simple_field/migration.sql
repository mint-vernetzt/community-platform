/*
  Warnings:

  - You are about to drop the `OrganizationScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProfileScore` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationScore" DROP CONSTRAINT "OrganizationScore_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "ProfileScore" DROP CONSTRAINT "ProfileScore_profile_id_fkey";

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "OrganizationScore";

-- DropTable
DROP TABLE "ProfileScore";
