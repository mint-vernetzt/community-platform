-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "mastodon" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tiktok" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "mastodon" TEXT,
ADD COLUMN     "tiktok" TEXT;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "mastodon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tiktok" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "mastodon" TEXT,
ADD COLUMN     "tiktok" TEXT;
