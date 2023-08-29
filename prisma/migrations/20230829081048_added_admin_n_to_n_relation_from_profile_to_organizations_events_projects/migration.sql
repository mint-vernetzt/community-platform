-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "admins" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "admins" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "administeredEvents" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "administeredOrganizations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "administeredProjects" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "admins" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "admins_of_organizations" (
    "profileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_of_organizations_pkey" PRIMARY KEY ("profileId","organizationId")
);

-- CreateTable
CREATE TABLE "admins_of_events" (
    "profile_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_of_events_pkey" PRIMARY KEY ("profile_id","event_id")
);

-- CreateTable
CREATE TABLE "admins_of_projects" (
    "profile_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_of_projects_pkey" PRIMARY KEY ("profile_id","project_id")
);

-- AddForeignKey
ALTER TABLE "admins_of_organizations" ADD CONSTRAINT "admins_of_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins_of_organizations" ADD CONSTRAINT "admins_of_organizations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins_of_events" ADD CONSTRAINT "admins_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins_of_events" ADD CONSTRAINT "admins_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins_of_projects" ADD CONSTRAINT "admins_of_projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins_of_projects" ADD CONSTRAINT "admins_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
