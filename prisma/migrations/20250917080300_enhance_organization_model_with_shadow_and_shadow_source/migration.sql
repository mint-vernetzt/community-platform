-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "shadow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadow_source" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "shadow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadow_source" TEXT;
