/*
  Warnings:

  - The primary key for the `invites_for_profiles_to_join_organizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `invites_for_profiles_to_join_organizations` table. All the data in the column will be lost.
  - The primary key for the `requests_to_organizations_to_add_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `requests_to_organizations_to_add_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invites_for_profiles_to_join_organizations" DROP CONSTRAINT "invites_for_profiles_to_join_organizations_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "invites_for_profiles_to_join_organizations_pkey" PRIMARY KEY ("profile_id", "organization_id");

-- AlterTable
ALTER TABLE "requests_to_organizations_to_add_profiles" DROP CONSTRAINT "requests_to_organizations_to_add_profiles_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "requests_to_organizations_to_add_profiles_pkey" PRIMARY KEY ("profile_id", "organization_id");
