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
    "profileId" TEXT NOT NULL,

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
    "organizationId" TEXT NOT NULL,

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
    "eventId" TEXT NOT NULL,

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
    "projectId" TEXT NOT NULL,

    CONSTRAINT "project_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_visibilities_profileId_key" ON "profile_visibilities"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_visibilities_organizationId_key" ON "organization_visibilities"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_visibilities_eventId_key" ON "event_visibilities"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "project_visibilities_projectId_key" ON "project_visibilities"("projectId");

-- AddForeignKey
ALTER TABLE "profile_visibilities" ADD CONSTRAINT "profile_visibilities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_visibilities" ADD CONSTRAINT "organization_visibilities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_visibilities" ADD CONSTRAINT "event_visibilities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_visibilities" ADD CONSTRAINT "project_visibilities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
