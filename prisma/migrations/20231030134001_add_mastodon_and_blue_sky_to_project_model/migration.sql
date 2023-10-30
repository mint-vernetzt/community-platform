-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "blue_sky" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mastodon" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "blue_sky" TEXT,
ADD COLUMN     "mastodon" TEXT;
