-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "logo_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "logo_image_id" TEXT;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "avatar_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "avatar_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "avatar_image_id" TEXT;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "logo_image" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_image_id" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "logo_image_id" TEXT;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatar_image_id_fkey" FOREIGN KEY ("avatar_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_logo_image_id_fkey" FOREIGN KEY ("logo_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_logo_image_id_fkey" FOREIGN KEY ("logo_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
