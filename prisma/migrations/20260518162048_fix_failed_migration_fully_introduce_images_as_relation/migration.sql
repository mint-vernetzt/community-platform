/*
  Warnings:

  - You are about to drop the `image_meta_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_avatar_of_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_background_of_event_id_fkey";

-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_background_of_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_background_of_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_background_of_project_id_fkey";

-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_logo_of_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "image_meta_data" DROP CONSTRAINT "image_meta_data_logo_of_project_id_fkey";

-- DropForeignKey
ALTER TABLE "images_of_projects" DROP CONSTRAINT "images_of_projects_image_id_fkey";

-- DropTable
DROP TABLE "image_meta_data";

-- CreateTable
CREATE TABLE "image" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "credits" TEXT,
    "title" TEXT,
    "size_in_mb" DOUBLE PRECISION NOT NULL,
    "filename" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extension" TEXT NOT NULL,
    "avatar_of_profile_id" TEXT,
    "background_of_profile_id" TEXT,
    "logo_of_organization_id" TEXT,
    "background_of_organization_id" TEXT,
    "background_of_event_id" TEXT,
    "logo_of_project_id" TEXT,
    "background_of_project_id" TEXT,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "image_avatar_of_profile_id_key" ON "image"("avatar_of_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_profile_id_key" ON "image"("background_of_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_logo_of_organization_id_key" ON "image"("logo_of_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_organization_id_key" ON "image"("background_of_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_event_id_key" ON "image"("background_of_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_logo_of_project_id_key" ON "image"("logo_of_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_background_of_project_id_key" ON "image"("background_of_project_id");

-- AddForeignKey
ALTER TABLE "images_of_projects" ADD CONSTRAINT "images_of_projects_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_avatar_of_profile_id_fkey" FOREIGN KEY ("avatar_of_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_profile_id_fkey" FOREIGN KEY ("background_of_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_logo_of_organization_id_fkey" FOREIGN KEY ("logo_of_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_organization_id_fkey" FOREIGN KEY ("background_of_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_event_id_fkey" FOREIGN KEY ("background_of_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_logo_of_project_id_fkey" FOREIGN KEY ("logo_of_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_background_of_project_id_fkey" FOREIGN KEY ("background_of_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
