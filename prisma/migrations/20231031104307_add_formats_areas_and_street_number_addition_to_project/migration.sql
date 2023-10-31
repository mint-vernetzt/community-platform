-- AlterTable
ALTER TABLE "areas_on_profiles" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "areas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "formats" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "furtherFormats" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "street_number_addition" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "further_formats" TEXT[],
ADD COLUMN     "street_number_addition" TEXT;

-- CreateTable
CREATE TABLE "formats" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formats_of_projects" (
    "format_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formats_of_projects_pkey" PRIMARY KEY ("format_id","project_id")
);

-- CreateTable
CREATE TABLE "areas_on_projects" (
    "project_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,

    CONSTRAINT "areas_on_projects_pkey" PRIMARY KEY ("project_id","area_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formats_title_key" ON "formats"("title");

-- AddForeignKey
ALTER TABLE "areas_on_profiles" ADD CONSTRAINT "areas_on_profiles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formats_of_projects" ADD CONSTRAINT "formats_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formats_of_projects" ADD CONSTRAINT "formats_of_projects_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "formats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_projects" ADD CONSTRAINT "areas_on_projects_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_projects" ADD CONSTRAINT "areas_on_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
