-- DropForeignKey
ALTER TABLE "areas_on_organizations" DROP CONSTRAINT "areas_on_organizations_areaId_fkey";

-- DropForeignKey
ALTER TABLE "areas_on_profiles" DROP CONSTRAINT "areas_on_profiles_areaId_fkey";

-- DropForeignKey
ALTER TABLE "focuses_on_organizations" DROP CONSTRAINT "focuses_on_organizations_focusId_fkey";

-- DropForeignKey
ALTER TABLE "offers_on_profiles" DROP CONSTRAINT "offers_on_profiles_offerId_fkey";

-- DropForeignKey
ALTER TABLE "organization_types_on_organizations" DROP CONSTRAINT "organization_types_on_organizations_organizationTypeId_fkey";

-- DropForeignKey
ALTER TABLE "seekings_on_profiles" DROP CONSTRAINT "seekings_on_profiles_offerId_fkey";

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_event_id" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experience_level_id" TEXT NOT NULL,
    "background" TEXT,
    "conference_link" TEXT,
    "conference_code" TEXT,
    "participant_limit" INTEGER,
    "participation_until" TIMESTAMP(3) NOT NULL,
    "venue_name" TEXT,
    "venue_street" TEXT,
    "venue_street_number" TEXT,
    "venue_city" TEXT,
    "venue_zip_code" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizing_profiles_of_events" (
    "event_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,

    CONSTRAINT "organizing_profiles_of_events_pkey" PRIMARY KEY ("event_id","profile_id")
);

-- CreateTable
CREATE TABLE "organizing_organizations_of_events" (
    "event_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "organizing_organizations_of_events_pkey" PRIMARY KEY ("event_id","organization_id")
);

-- CreateTable
CREATE TABLE "documents_of_events" (
    "event_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "documents_of_events_pkey" PRIMARY KEY ("event_id","document_id")
);

-- CreateTable
CREATE TABLE "areas_of_events" (
    "event_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,

    CONSTRAINT "areas_of_events_pkey" PRIMARY KEY ("event_id","area_id")
);

-- CreateTable
CREATE TABLE "waiting_participants_of_events" (
    "profile_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waiting_participants_of_events_pkey" PRIMARY KEY ("profile_id","event_id")
);

-- CreateTable
CREATE TABLE "tags_of_events" (
    "tag_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_of_events_pkey" PRIMARY KEY ("tag_id","event_id")
);

-- CreateTable
CREATE TABLE "event_types_of_events" (
    "event_type_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_types_of_events_pkey" PRIMARY KEY ("event_type_id","event_id")
);

-- CreateTable
CREATE TABLE "focuses_on_events" (
    "event_id" TEXT NOT NULL,
    "focus_id" TEXT NOT NULL,

    CONSTRAINT "focuses_on_events_pkey" PRIMARY KEY ("event_id","focus_id")
);

-- CreateTable
CREATE TABLE "target_groups_of_events" (
    "target_group_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "target_groups_of_events_pkey" PRIMARY KEY ("target_group_id","event_id")
);

-- CreateTable
CREATE TABLE "participants_of_events" (
    "profile_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_of_events_pkey" PRIMARY KEY ("profile_id","event_id")
);

-- CreateTable
CREATE TABLE "speakers_of_events" (
    "profile_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speakers_of_events_pkey" PRIMARY KEY ("profile_id","event_id")
);

-- CreateTable
CREATE TABLE "target_groups" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "target_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_levels" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "experience_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "target_groups_title_key" ON "target_groups"("title");

-- CreateIndex
CREATE UNIQUE INDEX "experience_levels_title_key" ON "experience_levels"("title");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_title_key" ON "event_types"("title");

-- CreateIndex
CREATE UNIQUE INDEX "tags_title_key" ON "tags"("title");

-- CreateIndex
CREATE UNIQUE INDEX "documents_file_name_key" ON "documents"("file_name");

-- AddForeignKey
ALTER TABLE "areas_on_profiles" ADD CONSTRAINT "areas_on_profiles_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seekings_on_profiles" ADD CONSTRAINT "seekings_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_on_profiles" ADD CONSTRAINT "offers_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_types_on_organizations" ADD CONSTRAINT "organization_types_on_organizations_organizationTypeId_fkey" FOREIGN KEY ("organizationTypeId") REFERENCES "organization_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focuses_on_organizations" ADD CONSTRAINT "focuses_on_organizations_focusId_fkey" FOREIGN KEY ("focusId") REFERENCES "focuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_organizations" ADD CONSTRAINT "areas_on_organizations_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_experience_level_id_fkey" FOREIGN KEY ("experience_level_id") REFERENCES "experience_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizing_profiles_of_events" ADD CONSTRAINT "organizing_profiles_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizing_profiles_of_events" ADD CONSTRAINT "organizing_profiles_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizing_organizations_of_events" ADD CONSTRAINT "organizing_organizations_of_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizing_organizations_of_events" ADD CONSTRAINT "organizing_organizations_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_of_events" ADD CONSTRAINT "documents_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_of_events" ADD CONSTRAINT "documents_of_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_of_events" ADD CONSTRAINT "areas_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_of_events" ADD CONSTRAINT "areas_of_events_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_participants_of_events" ADD CONSTRAINT "waiting_participants_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_participants_of_events" ADD CONSTRAINT "waiting_participants_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_of_events" ADD CONSTRAINT "tags_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_of_events" ADD CONSTRAINT "tags_of_events_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_types_of_events" ADD CONSTRAINT "event_types_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_types_of_events" ADD CONSTRAINT "event_types_of_events_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focuses_on_events" ADD CONSTRAINT "focuses_on_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focuses_on_events" ADD CONSTRAINT "focuses_on_events_focus_id_fkey" FOREIGN KEY ("focus_id") REFERENCES "focuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_groups_of_events" ADD CONSTRAINT "target_groups_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_groups_of_events" ADD CONSTRAINT "target_groups_of_events_target_group_id_fkey" FOREIGN KEY ("target_group_id") REFERENCES "target_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants_of_events" ADD CONSTRAINT "participants_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants_of_events" ADD CONSTRAINT "participants_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speakers_of_events" ADD CONSTRAINT "speakers_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speakers_of_events" ADD CONSTRAINT "speakers_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
