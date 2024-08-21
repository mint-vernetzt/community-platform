-- CreateEnum
CREATE TYPE "organization_roles" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "join_statuses" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "profileJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileJoinRequests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "joinOrganizationInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinOrganizationRequests" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "invites_for_profiles_to_join_organizations" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" "organization_roles" NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_for_profiles_to_join_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests_to_organizations_to_add_profiles" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_to_organizations_to_add_profiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invites_for_profiles_to_join_organizations" ADD CONSTRAINT "invites_for_profiles_to_join_organizations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_for_profiles_to_join_organizations" ADD CONSTRAINT "invites_for_profiles_to_join_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests_to_organizations_to_add_profiles" ADD CONSTRAINT "requests_to_organizations_to_add_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests_to_organizations_to_add_profiles" ADD CONSTRAINT "requests_to_organizations_to_add_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
