-- AlterTable
ALTER TABLE "event_visibilities" ALTER COLUMN "admins" SET DEFAULT false;

-- AlterTable
ALTER TABLE "organization_visibilities" ALTER COLUMN "admins" SET DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ALTER COLUMN "administeredEvents" SET DEFAULT false,
ALTER COLUMN "administeredOrganizations" SET DEFAULT false,
ALTER COLUMN "administeredProjects" SET DEFAULT false;

-- AlterTable
ALTER TABLE "project_visibilities" ALTER COLUMN "admins" SET DEFAULT false;
