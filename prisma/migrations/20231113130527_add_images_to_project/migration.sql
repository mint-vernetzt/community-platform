-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "documents" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "images" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "documents_of_projects" (
    "project_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "documents_of_projects_pkey" PRIMARY KEY ("project_id","document_id")
);

-- CreateTable
CREATE TABLE "images_of_projects" (
    "project_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,

    CONSTRAINT "images_of_projects_pkey" PRIMARY KEY ("project_id","image_id")
);

-- AddForeignKey
ALTER TABLE "documents_of_projects" ADD CONSTRAINT "documents_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_of_projects" ADD CONSTRAINT "documents_of_projects_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images_of_projects" ADD CONSTRAINT "images_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images_of_projects" ADD CONSTRAINT "images_of_projects_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
