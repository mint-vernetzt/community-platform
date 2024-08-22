/*
  Warnings:

  - The primary key for the `invites_for_profiles_to_join_organizations` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "invites_for_profiles_to_join_organizations" DROP CONSTRAINT "invites_for_profiles_to_join_organizations_pkey",
ADD CONSTRAINT "invites_for_profiles_to_join_organizations_pkey" PRIMARY KEY ("profile_id", "organization_id", "role");
