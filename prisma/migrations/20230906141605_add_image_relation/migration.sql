-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "background_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "background_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "background_image_id" TEXT;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "background_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "background_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "background_image_id" TEXT;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "background_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "background_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "background_image_id" TEXT;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "background_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "background_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "background_image_id" TEXT;

-- CreateTable
CREATE TABLE "image" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "credits" TEXT,
    "alt" TEXT,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
