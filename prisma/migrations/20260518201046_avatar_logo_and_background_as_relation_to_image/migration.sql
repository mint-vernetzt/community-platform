-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "background_of_event" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "eventVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "background_image_meta_data" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_image_meta_data" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizationVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "public_fields" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receivedNetworkJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receivedNetworkJoinRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsibleForEventInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentNetworkJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentNetworkJoinRequests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "avatar_image_meta_data" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "background_image_meta_data" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joinEventInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "public_fields" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "background_image_meta_data" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filter_vector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_image_meta_data" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "projectVisibility" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "image_meta_data" (
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

    CONSTRAINT "image_meta_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_avatar_of_profile_id_key" ON "image_meta_data"("avatar_of_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_background_of_profile_id_key" ON "image_meta_data"("background_of_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_logo_of_organization_id_key" ON "image_meta_data"("logo_of_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_background_of_organization_id_key" ON "image_meta_data"("background_of_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_background_of_event_id_key" ON "image_meta_data"("background_of_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_logo_of_project_id_key" ON "image_meta_data"("logo_of_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "image_meta_data_background_of_project_id_key" ON "image_meta_data"("background_of_project_id");

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_avatar_of_profile_id_fkey" FOREIGN KEY ("avatar_of_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_background_of_profile_id_fkey" FOREIGN KEY ("background_of_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_logo_of_organization_id_fkey" FOREIGN KEY ("logo_of_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_background_of_organization_id_fkey" FOREIGN KEY ("background_of_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_background_of_event_id_fkey" FOREIGN KEY ("background_of_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_logo_of_project_id_fkey" FOREIGN KEY ("logo_of_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_meta_data" ADD CONSTRAINT "image_meta_data_background_of_project_id_fkey" FOREIGN KEY ("background_of_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
