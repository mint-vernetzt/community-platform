-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "bluesky" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mastodon" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "bluesky" TEXT,
ADD COLUMN     "mastodon" TEXT;
