/*
  Warnings:

  - A unique constraint covering the columns `[avatar_of_profile_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[background_of_profile_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[logo_of_organization_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[background_of_organization_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[background_of_event_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[logo_of_project_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[background_of_project_id]` on the table `image` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_background_image_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_background_image_id_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_background_image_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_background_image_id_fkey";

-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "eventVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "image" ADD COLUMN     "avatar_of_profile_id" TEXT,
ADD COLUMN     "background_of_event_id" TEXT,
ADD COLUMN     "background_of_organization_id" TEXT,
ADD COLUMN     "background_of_profile_id" TEXT,
ADD COLUMN     "background_of_project_id" TEXT,
ADD COLUMN     "logo_of_organization_id" TEXT,
ADD COLUMN     "logo_of_project_id" TEXT;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizationVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "public_fields" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receivedNetworkJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receivedNetworkJoinRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsibleForEventInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentNetworkJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentNetworkJoinRequests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "avatar_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joinEventInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "public_fields" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "filter_vector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "projectVisibility" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "image_avatar_of_profile_id_key" ON "image"("avatar_of_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_profile_id_key" ON "image"("background_of_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_logo_of_organization_id_key" ON "image"("logo_of_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_organization_id_key" ON "image"("background_of_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_event_id_key" ON "image"("background_of_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_logo_of_project_id_key" ON "image"("logo_of_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_project_id_key" ON "image"("background_of_project_id");

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_avatar_of_profile_id_fkey" FOREIGN KEY ("avatar_of_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_profile_id_fkey" FOREIGN KEY ("background_of_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_logo_of_organization_id_fkey" FOREIGN KEY ("logo_of_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_organization_id_fkey" FOREIGN KEY ("background_of_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_event_id_fkey" FOREIGN KEY ("background_of_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_logo_of_project_id_fkey" FOREIGN KEY ("logo_of_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_project_id_fkey" FOREIGN KEY ("background_of_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
