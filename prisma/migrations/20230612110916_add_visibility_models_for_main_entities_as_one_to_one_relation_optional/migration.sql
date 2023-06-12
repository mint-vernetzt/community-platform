/*
  Warnings:

  - A unique constraint covering the columns `[event_visibility_id]` on the table `events` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_visibility_id]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profile_visibility_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_visibility_id]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "event_visibility_id" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "organization_visibility_id" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "profile_visibility_id" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "project_visibility_id" TEXT;

-- CreateTable
CREATE TABLE "profile_visibilities" (
    "id" TEXT NOT NULL,
    "username" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "phone" BOOLEAN NOT NULL DEFAULT false,
    "website" BOOLEAN NOT NULL DEFAULT false,
    "avatar" BOOLEAN NOT NULL DEFAULT true,
    "background" BOOLEAN NOT NULL DEFAULT true,
    "facebook" BOOLEAN NOT NULL DEFAULT false,
    "linkedin" BOOLEAN NOT NULL DEFAULT false,
    "twitter" BOOLEAN NOT NULL DEFAULT false,
    "xing" BOOLEAN NOT NULL DEFAULT false,
    "bio" BOOLEAN NOT NULL DEFAULT false,
    "skills" BOOLEAN NOT NULL DEFAULT false,
    "interests" BOOLEAN NOT NULL DEFAULT false,
    "academic_title" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BOOLEAN NOT NULL DEFAULT true,
    "first_name" BOOLEAN NOT NULL DEFAULT true,
    "last_name" BOOLEAN NOT NULL DEFAULT true,
    "terms_accepted" BOOLEAN NOT NULL DEFAULT true,
    "terms_accepted_at" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" BOOLEAN NOT NULL DEFAULT true,
    "position" BOOLEAN NOT NULL DEFAULT false,
    "instagram" BOOLEAN NOT NULL DEFAULT false,
    "youtube" BOOLEAN NOT NULL DEFAULT false,
    "score" BOOLEAN NOT NULL DEFAULT true,
    "areas" BOOLEAN NOT NULL DEFAULT true,
    "memberOf" BOOLEAN NOT NULL DEFAULT true,
    "offers" BOOLEAN NOT NULL DEFAULT false,
    "participatedEvents" BOOLEAN NOT NULL DEFAULT false,
    "seekings" BOOLEAN NOT NULL DEFAULT false,
    "contributedEvents" BOOLEAN NOT NULL DEFAULT true,
    "teamMemberOfEvents" BOOLEAN NOT NULL DEFAULT true,
    "teamMemberOfProjects" BOOLEAN NOT NULL DEFAULT true,
    "waitingForEvents" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profile_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_visibilities" (
    "id" TEXT NOT NULL,
    "name" BOOLEAN NOT NULL DEFAULT true,
    "slug" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "phone" BOOLEAN NOT NULL DEFAULT false,
    "street" BOOLEAN NOT NULL DEFAULT true,
    "city" BOOLEAN NOT NULL DEFAULT true,
    "website" BOOLEAN NOT NULL DEFAULT false,
    "logo" BOOLEAN NOT NULL DEFAULT true,
    "background" BOOLEAN NOT NULL DEFAULT true,
    "facebook" BOOLEAN NOT NULL DEFAULT true,
    "linkedin" BOOLEAN NOT NULL DEFAULT true,
    "twitter" BOOLEAN NOT NULL DEFAULT true,
    "xing" BOOLEAN NOT NULL DEFAULT true,
    "bio" BOOLEAN NOT NULL DEFAULT false,
    "quote" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BOOLEAN NOT NULL DEFAULT true,
    "quote_author" BOOLEAN NOT NULL DEFAULT true,
    "quote_author_information" BOOLEAN NOT NULL DEFAULT true,
    "street_number" BOOLEAN NOT NULL DEFAULT true,
    "supported_by" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" BOOLEAN NOT NULL DEFAULT true,
    "zip_code" BOOLEAN NOT NULL DEFAULT true,
    "instagram" BOOLEAN NOT NULL DEFAULT true,
    "youtube" BOOLEAN NOT NULL DEFAULT true,
    "score" BOOLEAN NOT NULL DEFAULT true,
    "areas" BOOLEAN NOT NULL DEFAULT true,
    "focuses" BOOLEAN NOT NULL DEFAULT false,
    "networkMembers" BOOLEAN NOT NULL DEFAULT true,
    "memberOf" BOOLEAN NOT NULL DEFAULT true,
    "teamMembers" BOOLEAN NOT NULL DEFAULT true,
    "types" BOOLEAN NOT NULL DEFAULT true,
    "responsibleForEvents" BOOLEAN NOT NULL DEFAULT true,
    "responsibleForProject" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organization_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_visibilities" (
    "id" TEXT NOT NULL,
    "name" BOOLEAN NOT NULL DEFAULT true,
    "slug" BOOLEAN NOT NULL DEFAULT true,
    "start_time" BOOLEAN NOT NULL DEFAULT true,
    "end_time" BOOLEAN NOT NULL DEFAULT true,
    "parent_event_id" BOOLEAN NOT NULL DEFAULT true,
    "description" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" BOOLEAN NOT NULL DEFAULT true,
    "experience_level_id" BOOLEAN NOT NULL DEFAULT true,
    "background" BOOLEAN NOT NULL DEFAULT true,
    "conference_link" BOOLEAN NOT NULL DEFAULT true,
    "conference_code" BOOLEAN NOT NULL DEFAULT true,
    "participant_limit" BOOLEAN NOT NULL DEFAULT true,
    "participation_until" BOOLEAN NOT NULL DEFAULT true,
    "venue_name" BOOLEAN NOT NULL DEFAULT true,
    "venue_street" BOOLEAN NOT NULL DEFAULT true,
    "venue_street_number" BOOLEAN NOT NULL DEFAULT true,
    "venue_city" BOOLEAN NOT NULL DEFAULT true,
    "venue_zip_code" BOOLEAN NOT NULL DEFAULT true,
    "canceled" BOOLEAN NOT NULL DEFAULT true,
    "stage_id" BOOLEAN NOT NULL DEFAULT true,
    "subline" BOOLEAN NOT NULL DEFAULT true,
    "participation_from" BOOLEAN NOT NULL DEFAULT true,
    "areas" BOOLEAN NOT NULL DEFAULT true,
    "documents" BOOLEAN NOT NULL DEFAULT true,
    "types" BOOLEAN NOT NULL DEFAULT true,
    "experienceLevel" BOOLEAN NOT NULL DEFAULT true,
    "parentEvent" BOOLEAN NOT NULL DEFAULT true,
    "childEvents" BOOLEAN NOT NULL DEFAULT true,
    "stage" BOOLEAN NOT NULL DEFAULT true,
    "focuses" BOOLEAN NOT NULL DEFAULT true,
    "participants" BOOLEAN NOT NULL DEFAULT false,
    "responsibleOrganizations" BOOLEAN NOT NULL DEFAULT true,
    "speakers" BOOLEAN NOT NULL DEFAULT true,
    "tags" BOOLEAN NOT NULL DEFAULT true,
    "targetGroups" BOOLEAN NOT NULL DEFAULT true,
    "teamMembers" BOOLEAN NOT NULL DEFAULT true,
    "waitingList" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_visibilities" (
    "id" TEXT NOT NULL,
    "name" BOOLEAN NOT NULL DEFAULT true,
    "slug" BOOLEAN NOT NULL DEFAULT true,
    "logo" BOOLEAN NOT NULL DEFAULT true,
    "background" BOOLEAN NOT NULL DEFAULT true,
    "headline" BOOLEAN NOT NULL DEFAULT true,
    "excerpt" BOOLEAN NOT NULL DEFAULT true,
    "description" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "phone" BOOLEAN NOT NULL DEFAULT true,
    "website" BOOLEAN NOT NULL DEFAULT true,
    "street" BOOLEAN NOT NULL DEFAULT true,
    "street_number" BOOLEAN NOT NULL DEFAULT true,
    "zip_code" BOOLEAN NOT NULL DEFAULT true,
    "facebook" BOOLEAN NOT NULL DEFAULT true,
    "linkedin" BOOLEAN NOT NULL DEFAULT true,
    "twitter" BOOLEAN NOT NULL DEFAULT true,
    "youtube" BOOLEAN NOT NULL DEFAULT true,
    "instagram" BOOLEAN NOT NULL DEFAULT true,
    "xing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" BOOLEAN NOT NULL DEFAULT true,
    "city" BOOLEAN NOT NULL DEFAULT true,
    "awards" BOOLEAN NOT NULL DEFAULT true,
    "disciplines" BOOLEAN NOT NULL DEFAULT true,
    "responsibleOrganizations" BOOLEAN NOT NULL DEFAULT true,
    "targetGroups" BOOLEAN NOT NULL DEFAULT true,
    "teamMembers" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "project_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_event_visibility_id_key" ON "events"("event_visibility_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_organization_visibility_id_key" ON "organizations"("organization_visibility_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_profile_visibility_id_key" ON "profiles"("profile_visibility_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_visibility_id_key" ON "projects"("project_visibility_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_visibility_id_fkey" FOREIGN KEY ("profile_visibility_id") REFERENCES "profile_visibilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_visibility_id_fkey" FOREIGN KEY ("organization_visibility_id") REFERENCES "organization_visibilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_event_visibility_id_fkey" FOREIGN KEY ("event_visibility_id") REFERENCES "event_visibilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_visibility_id_fkey" FOREIGN KEY ("project_visibility_id") REFERENCES "project_visibilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
